from flask import Flask, request, jsonify
from flask_cors import CORS
from ortools.sat.python import cp_model
import json
import os
import logging
from datetime import datetime, timedelta

# Configuration Flask
app = Flask(__name__)
CORS(app, origins="*")

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlanningBoulangerieSolver:
    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = 60.0
        
    def solve_planning(self, employees, constraints, affluences, week_number):
        """
        Résolution avec contraintes optimisées pour un meilleur équilibrage
        """
        try:
            logger.info(f"Début résolution planning semaine {week_number}")
            logger.info(f"Employés: {len(employees)}, Contraintes: {len(constraints)}")
            
            self.model = cp_model.CpModel()
            
            # CRÉNEAUX SIMPLIFIÉS MAIS COMPLETS
            def get_time_slots_for_day(day_index, affluence_level):
                """Créneaux avec plus de flexibilité"""
                
                if day_index == 6:  # DIMANCHE
                    return [
                        'Repos',
                        '06h00-13h00',    # Ouverture matin
                        '07h30-13h00',    # Support matin  
                        '09h30-13h00',    # Renfort matin
                        '13h00-20h30',    # Fermeture après-midi
                        '14h00-20h30',    # Support fermeture
                    ]
                    
                elif day_index == 5:  # SAMEDI
                    return [
                        'Repos',
                        '06h00-16h30',    # Ouverture longue
                        '07h30-16h30',    # Support matin
                        '10h30-16h30',    # Renfort midi
                        '16h30-20h30',    # Fermeture
                        '17h00-20h30',    # Support fermeture
                    ]
                    
                else:  # LUNDI À VENDREDI
                    base_slots = [
                        'Repos',
                        '06h00-14h00',    # Ouverture standard
                        '07h30-15h30',    # Support matin
                        '13h00-20h30',    # Fermeture
                    ]
                    
                    # Ajouter selon affluence
                    if affluence_level >= 2:
                        base_slots.extend([
                            '10h00-18h00',    # Renfort midi
                            '14h00-20h30',    # Renfort fermeture
                        ])
                    
                    if affluence_level >= 3:
                        base_slots.extend([
                            '09h00-17h00',    # Renfort matinée
                            '16h00-20h30',    # Support fermeture courte
                        ])
                    
                    return base_slots

            # HEURES PAR CRÉNEAU
            slot_hours = {
                # Créneaux semaine
                '06h00-14h00': 8.0,
                '07h30-15h30': 8.0,
                '09h00-17h00': 8.0,
                '10h00-18h00': 8.0,
                '13h00-20h30': 7.5,
                '14h00-20h30': 6.5,
                '16h00-20h30': 4.5,
                
                # Créneaux samedi
                '06h00-16h30': 10.5,
                '07h30-16h30': 9.0,
                '10h30-16h30': 6.0,
                '16h30-20h30': 4.0,
                '17h00-20h30': 3.5,
                
                # Créneaux dimanche
                '06h00-13h00': 7.0,
                '07h30-13h00': 5.5,
                '09h30-13h00': 3.5,
                '13h00-20h30': 7.5,
                '14h00-20h30': 6.5,
                
                # Spéciaux
                'Formation': 8.0,
                'CP': 5.5,
                'Maladie': 0,
                'Indisponible': 0,
                'Repos': 0
            }

            # Variables décisionnelles
            shifts = {}
            days = 7
            
            # Validation des données d'entrée
            if len(employees) < 1:
                return {
                    'success': False,
                    'error': 'Au moins 1 employé est nécessaire',
                    'diagnostic': ['Aucun employé fourni'],
                    'suggestions': ['Ajoutez au moins un employé']
                }
            
            diagnostic = []
            suggestions = []
            
            # Vérifier les compétences
            opening_staff = sum(1 for emp in employees if 'Ouverture' in emp.get('skills', []))
            closing_staff = sum(1 for emp in employees if 'Fermeture' in emp.get('skills', []))
            
            if opening_staff == 0:
                diagnostic.append('Aucun employé avec compétence Ouverture')
                suggestions.append('Ajoutez la compétence Ouverture à au moins un employé')
            
            if closing_staff == 0:
                diagnostic.append('Aucun employé avec compétence Fermeture')
                suggestions.append('Ajoutez la compétence Fermeture à au moins un employé')
            
            # Initialiser les variables pour chaque employé
            for emp in employees:
                emp_id = str(emp['id'])
                shifts[emp_id] = {}
                
                for day in range(days):
                    shifts[emp_id][day] = {}
                    available_slots = get_time_slots_for_day(day, affluences[day])
                    
                    # Appliquer contraintes spécifiques
                    if emp_id in constraints and str(day) in constraints[emp_id]:
                        constraint_value = constraints[emp_id][str(day)]
                        if constraint_value in ['CP', 'Maladie', 'Formation', 'Indisponible', 'Repos']:
                            available_slots = [constraint_value]
                    
                    # Contraintes apprentis : jours de formation
                    if emp.get('contract') == 'Apprentissage' and 'trainingDays' in emp:
                        if (day + 1) in emp['trainingDays']:
                            available_slots = ['Formation']
                    
                    for slot in available_slots:
                        if slot not in slot_hours:
                            slot_hours[slot] = 0
                        shifts[emp_id][day][slot] = self.model.NewBoolVar(f'shift_{emp_id}_{day}_{slot}')
            
            # CONTRAINTES OPTIMISÉES
            
            # 1. Volume horaire STRICT (tolérance réduite à ±0.5h)
            for emp in employees:
                emp_id = str(emp['id'])
                total_hours = []
                
                for day in range(days):
                    for slot, var in shifts[emp_id][day].items():
                        hours_int = int(slot_hours[slot] * 10)
                        total_hours.append(var * hours_int)
                
                target_hours = emp['volume'] * 10
                # Tolérance de ±0.5h seulement pour plus de précision
                tolerance = 5  # 0.5h * 10
                self.model.Add(sum(total_hours) >= (target_hours - tolerance))
                self.model.Add(sum(total_hours) <= (target_hours + tolerance))
            
            # 2. Un seul créneau par jour et par employé
            for emp in employees:
                emp_id = str(emp['id'])
                for day in range(days):
                    self.model.Add(sum(shifts[emp_id][day].values()) == 1)
            
            # 3. Repos obligatoires - AMÉLIORÉ
            for emp in employees:
                emp_id = str(emp['id'])
                rest_count = []
                
                for day in range(days):
                    if not (emp_id in constraints and str(day) in constraints[emp_id]):
                        if 'Repos' in shifts[emp_id][day]:
                            rest_count.append(shifts[emp_id][day]['Repos'])
                
                if rest_count:
                    # 2 repos minimum pour les temps pleins (≥35h)
                    if emp['volume'] >= 35:
                        self.model.Add(sum(rest_count) >= 2)
                    else:
                        self.model.Add(sum(rest_count) >= 1)
            
            # 4. Contraintes d'ouverture STRICTES
            for day in range(7):
                opening_vars = []
                for emp in employees:
                    emp_id = str(emp['id'])
                    if 'Ouverture' in emp.get('skills', []):
                        for slot in shifts[emp_id][day]:
                            if slot.startswith('06h00'):
                                opening_vars.append(shifts[emp_id][day][slot])
                
                # Exactement 1 personne à l'ouverture
                if opening_vars:
                    self.model.Add(sum(opening_vars) == 1)
            
            # 5. Contraintes de fermeture STRICTES
            for day in range(7):
                closing_vars_skilled = []  # Avec compétence fermeture
                
                for emp in employees:
                    emp_id = str(emp['id'])
                    for slot in shifts[emp_id][day]:
                        if '20h30' in slot and not slot.startswith('06h00'):
                            if 'Fermeture' in emp.get('skills', []):
                                closing_vars_skilled.append(shifts[emp_id][day][slot])
                
                # Au moins 1 personne avec compétence fermeture
                if closing_vars_skilled:
                    self.model.Add(sum(closing_vars_skilled) >= 1)
            
            # 6. Contraintes mineurs
            for emp in employees:
                if emp.get('status') == 'Mineur':
                    emp_id = str(emp['id'])
                    
                    # Repos dimanche obligatoire pour mineurs
                    if 'Repos' in shifts[emp_id][6]:
                        self.model.Add(shifts[emp_id][6]['Repos'] == 1)
                    
                    # Maximum 35h pour mineurs
                    total_hours_minor = []
                    for day in range(days):
                        for slot, var in shifts[emp_id][day].items():
                            hours_int = int(slot_hours[slot] * 10)
                            total_hours_minor.append(var * hours_int)
                    
                    self.model.Add(sum(total_hours_minor) <= 350)  # 35h max
            
            # OBJECTIF MULTI-CRITÈRES
            objectives = []
            
            # Priorité 1: Respecter les volumes horaires
            for emp in employees:
                emp_id = str(emp['id'])
                total_hours_var = self.model.NewIntVar(0, 500, f'total_hours_{emp_id}')
                
                hour_terms = []
                for day in range(days):
                    for slot, var in shifts[emp_id][day].items():
                        hours_int = int(slot_hours[slot] * 10)
                        hour_terms.append(var * hours_int)
                
                self.model.Add(total_hours_var == sum(hour_terms))
                
                target_hours = emp['volume'] * 10
                gap_pos = self.model.NewIntVar(0, 100, f'gap_pos_{emp_id}')
                gap_neg = self.model.NewIntVar(0, 100, f'gap_neg_{emp_id}')
                
                self.model.Add(total_hours_var + gap_neg - gap_pos == target_hours)
                # Poids plus élevé pour les écarts de volume
                objectives.append(20 * (gap_pos + gap_neg))
            
            # Objectif global
            self.model.Minimize(sum(objectives))
            
            # Résolution avec paramètres optimisés
            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = 60.0
            solver.parameters.log_search_progress = False
            solver.parameters.num_search_workers = 4
            
            status = solver.Solve(self.model)
            
            logger.info(f"Statut résolution: {status}")
            
            if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
                # Construire la solution
                solution = {}
                validation = {'errors': [], 'warnings': [], 'stats': {}}
                
                total_week_hours = 0
                
                for emp in employees:
                    emp_id = str(emp['id'])
                    solution[emp_id] = {}
                    emp_total_hours = 0
                    
                    for day in range(days):
                        assigned_slot = 'Repos'  # Par défaut
                        
                        for slot, var in shifts[emp_id][day].items():
                            if solver.Value(var) == 1:
                                assigned_slot = slot
                                if slot != 'Repos':
                                    emp_total_hours += slot_hours.get(slot, 0)
                                break
                        
                        solution[emp_id][day] = assigned_slot
                    
                    total_week_hours += emp_total_hours
                    
                    # Validation volume horaire
                    volume_diff = abs(emp_total_hours - emp['volume'])
                    if volume_diff > 0.5:  # Tolérance 0.5h
                        validation['warnings'].append(
                            f"{emp['name']}: {emp_total_hours}h au lieu de {emp['volume']}h (écart {volume_diff:+.1f}h)"
                        )
                
                validation['stats'] = {
                    'total_hours': total_week_hours,
                    'diagnostic': diagnostic,
                    'suggestions': suggestions
                }
                
                logger.info(f"Solution trouvée: {total_week_hours}h totales")
                
                return {
                    'success': True,
                    'planning': solution,
                    'validation': validation,
                    'diagnostic': diagnostic,
                    'suggestions': suggestions,
                    'solver_info': {
                        'status': 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE',
                        'solve_time': solver.WallTime(),
                        'objective': solver.ObjectiveValue() if status == cp_model.OPTIMAL else None
                    }
                }
            
            else:
                # Diagnostics spécifiques selon le statut
                if status == cp_model.INFEASIBLE:
                    error_msg = "Aucune solution possible avec les contraintes actuelles"
                    diagnostic.extend([
                        'Les contraintes sont trop restrictives',
                        'Impossible de respecter tous les volumes horaires avec 2 repos minimum',
                        'Conflit entre contraintes et compétences requises'
                    ])
                    suggestions.extend([
                        'Vérifiez que vous avez assez de personnel',
                        'Assurez-vous d\'avoir au moins 2 personnes avec compétence Ouverture',
                        'Assurez-vous d\'avoir au moins 2 personnes avec compétence Fermeture',
                        'Réduisez temporairement les contraintes de congés'
                    ])
                elif status == cp_model.MODEL_INVALID:
                    error_msg = "Modèle de contraintes invalide"
                    diagnostic.append('Erreur dans la définition du problème')
                else:
                    error_msg = f"Résolution échouée (statut: {status})"
                
                return {
                    'success': False,
                    'error': error_msg,
                    'diagnostic': diagnostic,
                    'suggestions': suggestions,
                    'solver_info': {
                        'status': status,
                        'solve_time': solver.WallTime() if solver else 0
                    }
                }
        
        except Exception as e:
            logger.error(f"Erreur dans solve_planning: {str(e)}")
            return {
                'success': False,
                'error': f'Erreur technique: {str(e)}',
                'diagnostic': ['Erreur interne du solveur'],
                'suggestions': ['Vérifiez le format des données d\'entrée', 'Contactez le support technique']
            }

# Instance globale du solver
solver_instance = PlanningBoulangerieSolver()

@app.route('/', methods=['GET'])
def health_check():
    """Point de santé principal"""
    return jsonify({
        'status': 'online',
        'service': 'Planning Boulangerie OR-Tools API',
        'version': '5.0',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'status': 'GET /',
            'solve': 'POST /solve'
        }
    })

@app.route('/solve', methods=['POST', 'OPTIONS'])
def solve_planning():
    """Endpoint principal pour résoudre un planning"""
    
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Aucune donnée JSON reçue',
                'diagnostic': ['Corps de requête vide'],
                'suggestions': ['Vérifiez que les données sont bien envoyées en JSON']
            }), 400
        
        required_fields = ['employees', 'affluences']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Champ manquant: {field}',
                    'diagnostic': [f'Le champ {field} est requis'],
                    'suggestions': ['Vérifiez la structure des données envoyées']
                }), 400
        
        employees = data['employees']
        constraints = data.get('constraints', {})
        affluences = data['affluences']
        week_number = data.get('week_number', 1)
        
        # Validation des données
        if len(employees) == 0:
            return jsonify({
                'success': False,
                'error': 'Aucun employé fourni',
                'diagnostic': ['Liste des employés vide'],
                'suggestions': ['Ajoutez au moins un employé']
            }), 400
        
        if len(affluences) != 7:
            return jsonify({
                'success': False,
                'error': 'Il faut exactement 7 valeurs d\'affluence (Lun-Dim)',
                'diagnostic': [f'Reçu {len(affluences)} valeurs au lieu de 7'],
                'suggestions': ['Vérifiez que vous avez une valeur d\'affluence pour chaque jour']
            }), 400
        
        logger.info(f"Résolution planning pour {len(employees)} employés")
        
        # Résoudre le planning
        result = solver_instance.solve_planning(employees, constraints, affluences, week_number)
        
        # Ajouter metadata
        result['metadata'] = {
            'processed_at': datetime.now().isoformat(),
            'week_number': week_number,
            'total_employees': len(employees),
            'api_version': '5.0'
        }
        
        status_code = 200 if result['success'] else 400
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        
        return response, status_code
        
    except json.JSONDecodeError:
        return jsonify({
            'success': False,
            'error': 'Format JSON invalide',
            'diagnostic': ['Données JSON malformées'],
            'suggestions': ['Vérifiez la syntaxe JSON']
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erreur serveur: {str(e)}',
            'diagnostic': ['Erreur interne du serveur'],
            'suggestions': ['Contactez le support technique']
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Démarrage serveur sur port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

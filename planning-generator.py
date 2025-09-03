#!/usr/bin/env python3
"""
Service OR-Tools 2 : Planning Generator
Récupère les contraintes calculées depuis MongoDB
Génère le planning final optimisé avec OR-Tools
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from datetime import datetime
import logging
import os
from typing import Dict, List, Any
from ortools.sat.python import cp_model
import json

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration MongoDB
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = 'boulangerie-planning'
COLLECTION_CONSTRAINTS = 'calculated_constraints'
COLLECTION_PLANNING = 'plannings'

# Connexion MongoDB
try:
    client = pymongo.MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    logger.info("✅ Connecté à MongoDB")
except Exception as e:
    logger.error(f"❌ Erreur connexion MongoDB: {e}")
    client = None

class PlanningGenerator:
    """Générateur de planning optimisé avec OR-Tools"""
    
    def __init__(self):
        self.days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
        self.shifts = {
            'opening': {'start': '06:00', 'end': '13:30', 'hours': 7.5, 'minutes': 450},  # 7h30 = 450 min
            'afternoon': {'start': '13:30', 'end': '16:00', 'hours': 2.5, 'minutes': 150},  # 2h30 = 150 min
            'evening': {'start': '16:00', 'end': '20:30', 'hours': 4.5, 'minutes': 270}   # 4h30 = 270 min
        }
    
    def get_calculated_constraints(self, week_number: int, year: int) -> List[Dict]:
        """Récupère les contraintes calculées depuis MongoDB"""
        
        if not client:
            return []
        
        try:
            constraints = list(db[COLLECTION_CONSTRAINTS].find({
                'week_number': week_number,
                'year': year
            }))
            
            logger.info(f"📊 Récupéré {len(constraints)} contraintes calculées")
            return constraints
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération contraintes: {e}")
            return []
    
    def create_ortools_model(self, employees: List[Dict], constraints: List[Dict], affluences: List[int]) -> Dict:
        """Crée et résout le modèle OR-Tools"""
        
        model = cp_model.CpModel()
        
        # Variables de décision
        # x[employee][day][shift] = 1 si l'employé travaille ce jour/ce shift
        x = {}
        for emp in employees:
            emp_id = str(emp['_id'])
            x[emp_id] = {}
            for day_idx, day in enumerate(self.days):
                x[emp_id][day_idx] = {}
                for shift in self.shifts.keys():
                    x[emp_id][day_idx][shift] = model.NewBoolVar(f'x_{emp_id}_{day_idx}_{shift}')
        
        # Contraintes
        self.add_constraints(model, x, employees, constraints, affluences)
        
        # Objectif : minimiser les déséquilibres
        self.add_objective(model, x, employees, constraints)
        
        return model, x
    
    def add_constraints(self, model, x, employees, constraints, affluences):
        """Ajoute les contraintes au modèle"""
        
        # Récupérer les contraintes calculées
        constraints_dict = {c['employee_id']: c for c in constraints}
        
        for emp in employees:
            emp_id = str(emp['_id'])
            emp_constraints = constraints_dict.get(emp_id, {})
            
            for day_idx, day in enumerate(self.days):
                # Contrainte : un employé ne peut travailler qu'un seul shift par jour
                day_shifts = [x[emp_id][day_idx][shift] for shift in self.shifts.keys()]
                model.AddAtMostOne(day_shifts)
                
                # Contraintes pré-calculées
                if day in emp_constraints.get('constraints', {}):
                    constraint_type = emp_constraints['constraints'][day]
                    
                    if constraint_type in ['MAL', 'Formation', 'CP', 'Repos']:
                        # L'employé ne peut pas travailler ce jour
                        for shift in self.shifts.keys():
                            model.Add(x[emp_id][day_idx][shift] == 0)
                
                # Règles pour mineurs
                if emp.get('age', 18) < 18:
                    if day == 'Dimanche':  # Pas de travail le dimanche
                        for shift in self.shifts.keys():
                            model.Add(x[emp_id][day_idx][shift] == 0)
        
        # Contraintes de couverture selon affluence
        for day_idx, (day, affluence) in enumerate(zip(self.days, affluences)):
            # Besoins en personnel selon affluence
            if affluence <= 2:  # Faible affluence
                min_staff = 4
                max_staff = 6
            elif affluence == 3:  # Affluence moyenne
                min_staff = 5
                max_staff = 7
            else:  # Forte affluence
                min_staff = 6
                max_staff = 8
            
            # Total employés par jour
            day_total = model.NewIntVar(min_staff, max_staff, f'day_total_{day_idx}')
            day_vars = []
            for emp_id in x.keys():
                for shift in self.shifts.keys():
                    day_vars.append(x[emp_id][day_idx][shift])
            
            model.Add(day_total == sum(day_vars))
        
        # Contraintes d'heures contractuelles
        for emp in employees:
            emp_id = str(emp['_id'])
            weekly_hours = emp.get('weeklyHours', 35)
            
            # Calculer les heures travaillées
            total_hours = 0
            for day_idx in range(7):
                for shift, shift_info in self.shifts.items():
                    total_hours += x[emp_id][day_idx][shift] * shift_info['hours']
            
            # Respecter les heures contractuelles (±2h de tolérance)
            model.Add(total_hours >= weekly_hours - 2)
            model.Add(total_hours <= weekly_hours + 2)
    
    def add_objective(self, model, x, employees, constraints):
        """Ajoute l'objectif d'optimisation"""
        
        # Minimiser les déséquilibres entre employés
        # Minimiser les changements de shift
        # Maximiser l'équité des weekends
        
        # Variables pour les pénalités
        penalties = []
        
        # Pénalité pour déséquilibre des heures
        for emp in employees:
            emp_id = str(emp['_id'])
            weekly_hours = emp.get('weeklyHours', 35)
            
            # Pénalité si trop d'heures
            excess_hours = model.NewIntVar(0, 10, f'excess_{emp_id}')
            total_minutes = sum(x[emp_id][day_idx][shift] * self.shifts[shift]['minutes'] 
                            for day_idx in range(7) for shift in self.shifts.keys())
            
            # Convertir en heures (diviser par 60)
            total_hours = total_minutes // 60
            model.Add(excess_hours >= total_hours - weekly_hours)
            penalties.append(excess_hours)
        
        # Minimiser la somme des pénalités
        model.Minimize(sum(penalties))
    
    def solve_planning(self, employees: List[Dict], week_number: int, year: int, affluences: List[int]) -> Dict:
        """Résout le planning avec OR-Tools"""
        
        try:
            # Récupérer les contraintes calculées
            constraints = self.get_calculated_constraints(week_number, year)
            
            if not constraints:
                return {'error': 'Aucune contrainte calculée trouvée'}
            
            logger.info(f"🧮 Résolution planning avec OR-Tools pour {len(employees)} employés")
            
            # Créer le modèle
            model, x = self.create_ortools_model(employees, constraints, affluences)
            
            # Résoudre
            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = 30.0  # Timeout 30s
            
            status = solver.Solve(model)
            
            if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
                logger.info("✅ Solution trouvée avec OR-Tools")
                
                # Construire la solution
                solution = self.build_solution(solver, x, employees, constraints)
                
                return {
                    'success': True,
                    'planning': solution,
                    'solver_status': str(status),
                    'solve_time': solver.WallTime()
                }
            else:
                logger.warning(f"⚠️ OR-Tools n'a pas trouvé de solution: {status}")
                return {'error': 'Aucune solution trouvée'}
                
        except Exception as e:
            logger.error(f"❌ Erreur résolution OR-Tools: {e}")
            return {'error': str(e)}
    
    def build_solution(self, solver, x, employees, constraints) -> Dict:
        """Construit la solution finale à partir du solveur"""
        
        solution = {}
        constraints_dict = {c['employee_id']: c for c in constraints}
        
        for emp in employees:
            emp_id = str(emp['_id'])
            solution[emp_id] = {}
            
            for day_idx, day in enumerate(self.days):
                # Vérifier les contraintes pré-calculées
                emp_constraints = constraints_dict.get(emp_id, {})
                if day in emp_constraints.get('constraints', {}):
                    solution[emp_id][day_idx] = emp_constraints['constraints'][day]
                    continue
                
                # Vérifier le travail
                day_worked = False
                for shift in self.shifts.keys():
                    if solver.Value(x[emp_id][day_idx][shift]) == 1:
                        solution[emp_id][day_idx] = f"{shift}_{self.shifts[shift]['start']}-{self.shifts[shift]['end']}"
                        day_worked = True
                        break
                
                if not day_worked:
                    solution[emp_id][day_idx] = 'Repos'
        
        return solution

    def place_opening_closing_shifts(self, employees: List[Dict], constraints: Dict, group_availability: Dict, week_number: int, year: int):
        """Place les shifts d'ouverture et fermeture selon les besoins stricts"""
        
        for day_index, day_name in enumerate(self.days):
            day_requirements = self.get_daily_requirements(day_name)
            
            # PLACEMENT OUVERTURE - RESPECT STRICT DES LIMITES
            if day_requirements.get('opening'):
                opening_needed = day_requirements['opening']['staff']
                opening_available = [emp for emp in group_availability['opening'] 
                                   if not constraints.get(str(emp['_id']), {}).get(day_name)]
                
                # Sélectionner exactement le nombre nécessaire
                opening_selected = self.select_best_employees(opening_available, opening_needed, day_name, constraints)
                
                for employee in opening_selected:
                    employee_id = str(employee['_id'])
                    if employee_id not in constraints:
                        constraints[employee_id] = {}
                    constraints[employee_id][day_name] = 'opening'
                    
                    # Marquer comme utilisé pour ce jour
                    employee['used_days'] = employee.get('used_days', [])
                    employee['used_days'].append(day_name)
            
            # PLACEMENT FERMETURE - RESPECT STRICT DES LIMITES
            if day_requirements.get('evening'):
                closing_needed = day_requirements['evening']['staff']
                closing_available = [emp for emp in group_availability['closing'] 
                                   if not constraints.get(str(emp['_id']), {}).get(day_name)]
                
                # Sélectionner exactement le nombre nécessaire
                closing_selected = self.select_best_employees(closing_available, closing_needed, day_name, constraints)
                
                for employee in closing_selected:
                    employee_id = str(employee['_id'])
                    if employee_id not in constraints:
                        constraints[employee_id] = {}
                    constraints[employee_id][day_name] = 'closing'
                    
                    # Marquer comme utilisé pour ce jour
                    employee['used_days'] = employee.get('used_days', [])
                    employee['used_days'].append(day_name)
    
    def select_best_employees(self, available_employees: List[Dict], needed: int, day_name: str, constraints: Dict) -> List[Dict]:
        """Sélectionne les meilleurs employés en respectant strictement les limites"""
        
        # Filtrer les employés disponibles pour ce jour
        available = [emp for emp in available_employees 
                    if not constraints.get(str(emp['_id']), {}).get(day_name)]
        
        if not available:
            return []
        
        # Trier par priorité: disponibilité + compétences + équilibrage
        available.sort(key=lambda emp: (
            emp.get('availableDays', 0),  # Plus de jours disponibles = priorité
            len(emp.get('used_days', [])),  # Moins utilisé = priorité
            emp.get('skills', [])  # Compétences spécifiques
        ), reverse=True)
        
        # Retourner exactement le nombre nécessaire
        return available[:needed]

@app.route('/generate-planning', methods=['POST'])
def generate_planning():
    """Endpoint principal pour générer le planning"""
    
    try:
        data = request.get_json()
        employees = data.get('employees', [])
        week_number = data.get('week_number')
        year = data.get('year')
        affluences = data.get('affluences', [2, 2, 2, 2, 2, 2, 2])
        
        if not employees or week_number is None or year is None:
            return jsonify({'error': 'Données manquantes'}), 400
        
        logger.info(f"🚀 Génération planning pour {len(employees)} employés, semaine {week_number}")
        
        # Vérifier que les contraintes sont calculées
        if not client:
            return jsonify({'error': 'MongoDB non connecté'}), 500
        
        constraints_count = db[COLLECTION_CONSTRAINTS].count_documents({
            'week_number': week_number,
            'year': year
        })
        
        if constraints_count == 0:
            return jsonify({'error': 'Contraintes non calculées. Appelez d\'abord /calculate-constraints'}), 400
        
        # Générer le planning
        generator = PlanningGenerator()
        result = generator.solve_planning(employees, week_number, year, affluences)
        
        if result.get('success'):
            # Enregistrer le planning en MongoDB
            try:
                planning_data = {
                    'week_number': week_number,
                    'year': year,
                    'generated_at': datetime.utcnow(),
                    'method': 'ortools_distributed',
                    'solver_status': result['solver_status'],
                    'solve_time': result['solve_time'],
                    'planning': result['planning']
                }
                
                db[COLLECTION_PLANNING].insert_one(planning_data)
                logger.info("💾 Planning enregistré en MongoDB")
                
            except Exception as e:
                logger.error(f"❌ Erreur enregistrement planning: {e}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Erreur génération planning: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du service"""
    return jsonify({
        'status': 'healthy',
        'service': 'planning-generator',
        'timestamp': datetime.utcnow().isoformat(),
        'mongodb': 'connected' if client else 'disconnected'
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=False)

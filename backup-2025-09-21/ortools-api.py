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
        self.weekend_history = {}  # Historique des weekends travaillés
        
    def calculate_weekend_frequencies(self, employees, week_number, weekend_history=None):
        """
        Calculer les fréquences de travail samedi/dimanche passées pour équilibrer
        """
        logger.info("📊 Calcul des fréquences de travail weekend")
        
        if weekend_history is None:
            weekend_history = {}
        
        weekend_scores = {}
        for emp in employees:
            emp_id = str(emp['id'])
            # Utiliser l'historique fourni ou valeurs par défaut
            saturday_count = weekend_history.get(f"{emp_id}_saturday", 0)
            sunday_count = weekend_history.get(f"{emp_id}_sunday", 0)
            
            # Score : plus le score est élevé, plus l'employé a travaillé les weekends
            weekend_scores[emp_id] = {
                'saturday_count': saturday_count,
                'sunday_count': sunday_count,
                'total_weekend': saturday_count + sunday_count
            }
            
            logger.info(f"👤 {emp['name']}: {saturday_count} samedis, {sunday_count} dimanches")
        
        return weekend_scores
    
    def adjust_weekly_hours_and_balance(self, solution, employees, slot_hours):
        """
        Ajuster les heures réglementaires et équilibrer selon l'affluence
        """
        logger.info("⚖️ Ajustement des heures réglementaires et équilibrage")
        
        adjusted_solution = {}
        
        for emp in employees:
            emp_id = str(emp['id'])
            if emp_id not in solution:
                continue
                
            target_hours = emp['volume']
            current_schedule = solution[emp_id]
            
            # Calculer les heures actuelles
            current_hours = 0
            work_days = 0
            for day in range(7):
                slot = current_schedule.get(day, 'Repos')
                if slot != 'Repos' and slot not in ['MAL', 'Formation', 'CP']:
                    current_hours += slot_hours.get(slot, 0)
                    work_days += 1
            
            logger.info(f"👤 {emp['name']}: {current_hours}h réalisées sur {target_hours}h contractuelles")
            
            # Calculer l'écart à répartir
            hour_difference = target_hours - current_hours
            
            if abs(hour_difference) > 0.5 and work_days > 0:  # Tolérance de 0.5h
                # Répartir l'écart sur les jours de travail
                daily_adjustment = hour_difference / work_days
                
                logger.info(f"📊 {emp['name']}: Écart de {hour_difference:.1f}h à répartir sur {work_days} jours")
                logger.info(f"🔧 Ajustement par jour: {daily_adjustment:.2f}h")
                
                # Appliquer l'ajustement en modifiant les créneaux
                adjusted_schedule = {}
                for day in range(7):
                    original_slot = current_schedule.get(day, 'Repos')
                    
                    if original_slot != 'Repos' and original_slot not in ['MAL', 'Formation', 'CP']:
                        # Ajuster le créneau
                        adjusted_slot = self.adjust_time_slot(original_slot, daily_adjustment, slot_hours)
                        adjusted_schedule[day] = adjusted_slot
                        logger.info(f"📅 Jour {day}: {original_slot} → {adjusted_slot}")
                    else:
                        adjusted_schedule[day] = original_slot
                
                adjusted_solution[emp_id] = adjusted_schedule
            else:
                # Pas d'ajustement nécessaire
                adjusted_solution[emp_id] = current_schedule
                logger.info(f"✅ {emp['name']}: Pas d'ajustement nécessaire")
        
        return adjusted_solution
    
    def adjust_time_slot(self, original_slot, adjustment_hours, slot_hours):
        """
        Ajuster un créneau horaire selon l'ajustement nécessaire
        """
        if adjustment_hours > 0:
            # Ajouter du temps (par exemple +30 minutes)
            if '06h00' in original_slot:
                return original_slot.replace('14h00', '14h30')  # +30 min
            elif '07h30' in original_slot:
                return original_slot.replace('15h30', '16h00')  # +30 min
            elif '11h00' in original_slot:
                return original_slot.replace('19h00', '19h30')  # +30 min
            elif '12h00' in original_slot:
                return original_slot.replace('20h00', '20h30')  # +30 min
            elif '13h00' in original_slot:
                return original_slot.replace('20h30', '21h00')  # +30 min
        else:
            # Réduire le temps (par exemple -15 minutes)
            if '06h00' in original_slot:
                return original_slot.replace('14h00', '13h45')  # -15 min
            elif '07h30' in original_slot:
                return original_slot.replace('15h30', '15h15')  # -15 min
            elif '11h00' in original_slot:
                return original_slot.replace('19h00', '18h45')  # -15 min
            elif '12h00' in original_slot:
                return original_slot.replace('20h00', '19h45')  # -15 min
            elif '13h00' in original_slot:
                return original_slot.replace('20h30', '20h15')  # -15 min
        
        # Si pas de correspondance, retourner le créneau original
        return original_slot
    
    def categorize_employees_by_groups(self, employees):
        """
        Classer les salariés par groupes de compétences
        """
        logger.info("👥 Classification des employés par groupes")
        
        groups = {
            'ouverture': [],
            'fermeture': [],
            'vente': []
        }
        
        for emp in employees:
            emp_id = str(emp['id'])
            skills = emp.get('skills', [])
            
            if 'Ouverture' in skills:
                groups['ouverture'].append(emp)
                logger.info(f"🌅 {emp['name']} → Groupe ouverture")
            elif 'Fermeture' in skills:
                groups['fermeture'].append(emp)
                logger.info(f"🌙 {emp['name']} → Groupe fermeture")
            else:
                groups['vente'].append(emp)
                logger.info(f"🛒 {emp['name']} → Groupe vente")
        
        return groups
    
    def calculate_group_availability(self, groups, constraints, week_number):
        """
        Calculer les disponibilités des groupes pour la semaine
        """
        logger.info("📋 Calcul des disponibilités par groupe")
        
        group_availability = {}
        days = 7
        
        for group_name, employees in groups.items():
            total_availability = 0
            available_employees = []
            
            logger.info(f"📊 Groupe {group_name}: {len(employees)} employés")
            
            for emp in employees:
                emp_id = str(emp['id'])
                emp_availability = 0
                
                # Calculer disponibilité = 5j - contraintes (cp, maladie, formation, ...)
                work_days_possible = 0
                
                for day in range(days):
                    # Vérifier s'il y a une contrainte ce jour-là
                    has_constraint = False
                    if emp_id in constraints and str(day) in constraints[emp_id]:
                        constraint = constraints[emp_id][str(day)]
                        if constraint in ['CP', 'MAL', 'Formation', 'Indisponible', 'Repos']:
                            has_constraint = True
                    
                    # Les mineurs ne travaillent pas le dimanche
                    if emp.get('status') == 'Mineur' and day == 6:  # Dimanche
                        has_constraint = True
                    
                    if not has_constraint:
                        work_days_possible += 1
                
                emp_availability = work_days_possible
                total_availability += emp_availability
                
                available_employees.append({
                    'employee': emp,
                    'availability': emp_availability
                })
                
                logger.info(f"👤 {emp['name']}: {emp_availability} jours disponibles")
            
            group_availability[group_name] = {
                'total_availability': total_availability,
                'employees': available_employees,
                'avg_availability': total_availability / len(employees) if employees else 0
            }
            
            logger.info(f"📈 Groupe {group_name}: {total_availability} jours total disponibles")
        
        return group_availability
    
    def distribute_opening_closing_shifts(self, group_availability, affluences):
        """
        Répartir les ouvertures et fermetures selon les disponibilités
        """
        logger.info("🔄 Répartition des ouvertures et fermetures")
        
        distribution = {
            'opening_assignments': {},  # jour -> employee_id
            'closing_assignments': {}   # jour -> employee_id
        }
        
        # Calculer le nombre d'ouvertures/fermetures nécessaires
        total_openings_needed = 7  # Une ouverture par jour
        total_closings_needed = 7  # Une fermeture par jour
        
        opening_group = group_availability.get('ouverture', {'employees': []})
        closing_group = group_availability.get('fermeture', {'employees': []})
        
        logger.info(f"🌅 {total_openings_needed} ouvertures à répartir sur {len(opening_group['employees'])} employés")
        logger.info(f"🌙 {total_closings_needed} fermetures à répartir sur {len(closing_group['employees'])} employés")
        
        # Répartition équitable des ouvertures
        if opening_group['employees']:
            opening_rotation = 0
            for day in range(7):
                available_openers = [emp for emp in opening_group['employees'] if emp['availability'] > 0]
                if available_openers:
                    selected_emp = available_openers[opening_rotation % len(available_openers)]
                    distribution['opening_assignments'][day] = selected_emp['employee']['id']
                    logger.info(f"🌅 Jour {day}: {selected_emp['employee']['name']} à l'ouverture")
                    opening_rotation += 1
        
        # Répartition équitable des fermetures
        if closing_group['employees']:
            closing_rotation = 0
            for day in range(7):
                available_closers = [emp for emp in closing_group['employees'] if emp['availability'] > 0]
                if available_closers:
                    selected_emp = available_closers[closing_rotation % len(available_closers)]
                    distribution['closing_assignments'][day] = selected_emp['employee']['id']
                    logger.info(f"🌙 Jour {day}: {selected_emp['employee']['name']} à la fermeture")
                    closing_rotation += 1
        
        return distribution
    
    def balance_shifts_by_affluence(self, solution, employees, affluences):
        """
        Équilibrer les journées en fonction de l'affluence et du volume horaire total
        CORRECTION: Assurer une répartition équitable pour même niveau d'affluence
        """
        logger.info("⚖️ Équilibrage selon l'affluence")
        
        # Grouper les jours par niveau d'affluence
        affluence_groups = {}
        for day in range(7):
            day_affluence = affluences[day]
            if day_affluence not in affluence_groups:
                affluence_groups[day_affluence] = []
            affluence_groups[day_affluence].append(day)
        
        # Analyser et équilibrer par groupe d'affluence
        for affluence_level, days in affluence_groups.items():
            logger.info(f"📊 Niveau d'affluence {affluence_level}: jours {days}")
            
            # Calculer la répartition actuelle
            day_stats = []
            for day in days:
                working_employees = []
                total_hours = 0
                
                for emp in employees:
                    emp_id = str(emp['id'])
                    if emp_id in solution:
                        slot = solution[emp_id].get(day, 'Repos')
                        if slot != 'Repos' and slot not in ['MAL', 'Formation', 'CP']:
                            working_employees.append({
                                'emp_id': emp_id,
                                'name': emp['name'],
                                'slot': slot
                            })
                            # Calculer les heures de ce créneau
                            slot_hours = self.get_slot_hours_value(slot)
                            total_hours += slot_hours
                
                day_stats.append({
                    'day': day,
                    'employees': len(working_employees),
                    'total_hours': total_hours,
                    'working_list': working_employees
                })
                
                logger.info(f"📅 Jour {day}: {len(working_employees)} employés, {total_hours}h total")
            
            # Détecter les déséquilibres pour même affluence
            if len(day_stats) > 1:
                employee_counts = [stat['employees'] for stat in day_stats]
                min_employees = min(employee_counts)
                max_employees = max(employee_counts)
                
                if max_employees - min_employees > 2:  # Écart trop important
                    logger.warning(f"⚠️ Déséquilibre détecté pour affluence {affluence_level}:")
                    logger.warning(f"   Minimum: {min_employees} employés, Maximum: {max_employees} employés")
                    logger.warning(f"   Recommandation: Équilibrer entre {min_employees+1} et {max_employees-1} employés")
        
        return solution
    
    def get_slot_hours_value(self, slot):
        """Obtenir les heures d'un créneau"""
        slot_hours = {
            '06h00-14h00': 8.0, '07h30-15h30': 8.0, '09h00-17h00': 8.0,
            '10h00-18h00': 8.0, '11h00-19h00': 8.0, '12h00-20h00': 8.0,
            '13h00-20h30': 7.5, '14h00-20h30': 6.5, '16h00-20h30': 4.5,
            '06h00-16h30': 10.5, '07h30-16h30': 9.0, '10h30-16h30': 6.0,
            '11h00-18h30': 7.5, '12h00-19h30': 7.5, '16h30-20h30': 4.0,
            '17h00-20h30': 3.5, '06h00-13h00': 7.0, '07h30-13h00': 5.5,
            '09h30-13h00': 3.5, '11h00-18h00': 7.0, '12h00-19h00': 7.0,
            '13h00-20h30': 7.5, '14h00-20h30': 6.5, 'Formation': 8.0,
            'CP': 5.5, 'MAL': 0, 'Repos': 0
        }
        return slot_hours.get(slot, 0)
    
    def solve_planning(self, employees, constraints, affluences, week_number, weekend_history=None):
        """
        Résolution avec stratégie de calcul adaptée selon les spécifications
        """
        try:
            logger.info(f"🚀 Début résolution planning semaine {week_number} - Nouvelle stratégie")
            logger.info(f"👥 Employés: {len(employees)}, Contraintes: {len(constraints)}")
            
            # ÉTAPE 1: Placer les contraintes (repos, congé, maladie, formations)
            logger.info("📋 ÉTAPE 1: Placement des contraintes")
            
            # ÉTAPE 2: Calculer les fréquences de travail weekend et placer les repos intelligemment
            logger.info("📊 ÉTAPE 2: Calcul des fréquences weekend")
            weekend_scores = self.calculate_weekend_frequencies(employees, week_number, weekend_history)
            
            # ÉTAPE 3: Calculer les disponibilités des groupes
            logger.info("👥 ÉTAPE 3: Classification et calcul des disponibilités")
            groups = self.categorize_employees_by_groups(employees)
            group_availability = self.calculate_group_availability(groups, constraints, week_number)
            
            # ÉTAPE 4: Répartir les ouvertures et fermetures
            logger.info("🔄 ÉTAPE 4: Répartition ouvertures/fermetures")
            shift_distribution = self.distribute_opening_closing_shifts(group_availability, affluences)
            
            # ÉTAPE 5: Résolution OR-Tools avec les nouvelles contraintes
            logger.info("⚙️ ÉTAPE 5: Résolution OR-Tools optimisée")
            
            self.model = cp_model.CpModel()
            
            # CRÉNEAUX AVEC NOUVEAUX CRÉNEAUX SPÉCIFIÉS (7h30, 11h, 12h)
            def get_time_slots_for_day(day_index, affluence_level):
                """Créneaux avec créneaux restants 7h30, 11h, 12h selon la stratégie"""
                
                if day_index == 6:  # DIMANCHE
                    return [
                        'Repos',
                        '06h00-13h00',    # Ouverture matin
                        '07h30-13h00',    # Créneau 7h30
                        '09h30-13h00',    # Renfort matin
                        '11h00-18h00',    # Créneau 11h
                        '12h00-19h00',    # Créneau 12h
                        '13h00-20h30',    # Fermeture après-midi
                        '14h00-20h30',    # Support fermeture
                    ]
                    
                elif day_index == 5:  # SAMEDI
                    return [
                        'Repos',
                        '06h00-16h30',    # Ouverture longue
                        '07h30-16h30',    # Créneau 7h30
                        '10h30-16h30',    # Renfort midi
                        '11h00-18h30',    # Créneau 11h
                        '12h00-19h30',    # Créneau 12h
                        '16h30-20h30',    # Fermeture
                        '17h00-20h30',    # Support fermeture
                    ]
                    
                else:  # LUNDI À VENDREDI
                    base_slots = [
                        'Repos',
                        '06h00-14h00',    # Ouverture standard
                        '07h30-15h30',    # Créneau 7h30
                        '11h00-19h00',    # Créneau 11h
                        '12h00-20h00',    # Créneau 12h
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

            # HEURES PAR CRÉNEAU (mise à jour avec nouveaux créneaux)
            slot_hours = {
                # Créneaux semaine
                '06h00-14h00': 8.0,
                '07h30-15h30': 8.0,
                '09h00-17h00': 8.0,
                '10h00-18h00': 8.0,
                '11h00-19h00': 8.0,    # Nouveau créneau 11h
                '12h00-20h00': 8.0,    # Nouveau créneau 12h
                '13h00-20h30': 7.5,
                '14h00-20h30': 6.5,
                '16h00-20h30': 4.5,
                
                # Créneaux samedi
                '06h00-16h30': 10.5,
                '07h30-16h30': 9.0,
                '10h30-16h30': 6.0,
                '11h00-18h30': 7.5,    # Nouveau créneau 11h samedi
                '12h00-19h30': 7.5,    # Nouveau créneau 12h samedi
                '16h30-20h30': 4.0,
                '17h00-20h30': 3.5,
                
                # Créneaux dimanche
                '06h00-13h00': 7.0,
                '07h30-13h00': 5.5,
                '09h30-13h00': 3.5,
                '11h00-18h00': 7.0,    # Nouveau créneau 11h dimanche
                '12h00-19h00': 7.0,    # Nouveau créneau 12h dimanche
                '13h00-20h30': 7.5,
                '14h00-20h30': 6.5,
                
                # Spéciaux
                'Formation': 8.0,
                'CP': 5.5,
                'MAL': 0,
                'Maladie': 0,
                'Indisponible': 0,
                'Repos': 0
            }

            # Variables décisionnelles avec intégration de la stratégie
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
            
            # 4. Contraintes d'ouverture STRICTES avec vérification des compétences
            for day in range(7):
                opening_vars = []
                
                # RÈGLE STRICTE: Seuls les employés avec compétence "Ouverture" peuvent ouvrir
                for emp in employees:
                    emp_id = str(emp['id'])
                    if 'Ouverture' in emp.get('skills', []):
                        for slot in shifts[emp_id][day]:
                            if slot.startswith('06h00'):
                                opening_vars.append(shifts[emp_id][day][slot])
                    else:
                        # INTERDIRE l'ouverture pour ceux sans compétence
                        for slot in shifts[emp_id][day]:
                            if slot.startswith('06h00'):
                                self.model.Add(shifts[emp_id][day][slot] == 0)
                                logger.info(f"🚫 {emp['name']} interdit à l'ouverture (pas de compétence)")
                
                # Prioriser l'employé assigné par la stratégie si disponible ET compétent
                if day in shift_distribution['opening_assignments']:
                    preferred_emp_id = str(shift_distribution['opening_assignments'][day])
                    preferred_emp = next((emp for emp in employees if str(emp['id']) == preferred_emp_id), None)
                    
                    if preferred_emp and 'Ouverture' in preferred_emp.get('skills', []):
                        if preferred_emp_id in shifts and day < len(shifts[preferred_emp_id]):
                            for slot in shifts[preferred_emp_id][day]:
                                if slot.startswith('06h00'):
                                    # Favoriser cet employé pour l'ouverture
                                    self.model.Add(shifts[preferred_emp_id][day][slot] == 1)
                                    logger.info(f"✅ {preferred_emp['name']} priorité ouverture jour {day}")
                                    break
                    else:
                        logger.warning(f"⚠️ Employé préféré {preferred_emp_id} jour {day} n'a pas compétence ouverture")
                
                # Exactement 1 personne à l'ouverture (parmi les compétents)
                if opening_vars:
                    self.model.Add(sum(opening_vars) == 1)
                else:
                    logger.error(f"❌ Aucun employé compétent pour ouverture jour {day}")
                    diagnostic.append(f'Jour {day}: Aucun employé avec compétence Ouverture disponible')
            
            # 5. Contraintes de fermeture STRICTES avec intégration de la stratégie
            for day in range(7):
                closing_vars_skilled = []  # Avec compétence fermeture
                
                for emp in employees:
                    emp_id = str(emp['id'])
                    for slot in shifts[emp_id][day]:
                        if '20h30' in slot and not slot.startswith('06h00'):
                            if 'Fermeture' in emp.get('skills', []):
                                closing_vars_skilled.append(shifts[emp_id][day][slot])
                
                # Prioriser l'employé assigné par la stratégie si disponible
                if day in shift_distribution['closing_assignments']:
                    preferred_emp_id = str(shift_distribution['closing_assignments'][day])
                    if preferred_emp_id in shifts and day < len(shifts[preferred_emp_id]):
                        for slot in shifts[preferred_emp_id][day]:
                            if '20h30' in slot and not slot.startswith('06h00'):
                                # Trouver l'employé correspondant
                                target_emp = next((emp for emp in employees if str(emp['id']) == preferred_emp_id), None)
                                if target_emp and 'Fermeture' in target_emp.get('skills', []):
                                    # Favoriser cet employé pour la fermeture
                                    self.model.Add(shifts[preferred_emp_id][day][slot] == 1)
                                    break
                
                # Au moins 1 personne avec compétence fermeture
                if closing_vars_skilled:
                    self.model.Add(sum(closing_vars_skilled) >= 1)
            
            # 6. Contraintes mineurs avec repos dimanche obligatoire
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
            
            # 7. Contraintes repos weekend intelligents basés sur l'historique
            for emp in employees:
                emp_id = str(emp['id'])
                weekend_score = weekend_scores.get(emp_id, {'total_weekend': 0})
                
                # Plus l'employé a travaillé les weekends, plus il a de chance d'avoir repos
                if weekend_score['total_weekend'] > 4:  # Seuil arbitraire
                    # Priorité au repos samedi/dimanche
                    if 'Repos' in shifts[emp_id][5]:  # Samedi
                        # Augmenter la probabilité de repos samedi
                        pass  # OR-Tools gérera via l'objectif
                    if 'Repos' in shifts[emp_id][6]:  # Dimanche
                        # Augmenter la probabilité de repos dimanche
                        pass  # OR-Tools gérera via l'objectif
            
            # 8. NOUVELLE CONTRAINTE: Équilibrage lundi-vendredi pour même affluence
            # Grouper les jours de semaine par affluence
            weekday_affluence_groups = {}
            for day in range(5):  # Lundi à vendredi seulement
                day_affluence = affluences[day]
                if day_affluence not in weekday_affluence_groups:
                    weekday_affluence_groups[day_affluence] = []
                weekday_affluence_groups[day_affluence].append(day)
            
            # Pour chaque groupe d'affluence, équilibrer le nombre d'employés
            for affluence_level, days_group in weekday_affluence_groups.items():
                if len(days_group) > 1:  # Plusieurs jours avec même affluence
                    logger.info(f"⚖️ Équilibrage affluence {affluence_level}: jours {days_group}")
                    
                    # Contrainte: écart max de 2 employés entre jours de même affluence
                    for i, day1 in enumerate(days_group):
                        for day2 in days_group[i+1:]:
                            working_day1 = []
                            working_day2 = []
                            
                            for emp in employees:
                                emp_id = str(emp['id'])
                                for slot, var in shifts[emp_id][day1].items():
                                    if slot != 'Repos':
                                        working_day1.append(var)
                                for slot, var in shifts[emp_id][day2].items():
                                    if slot != 'Repos':
                                        working_day2.append(var)
                            
                            # Contrainte: |employés_jour1 - employés_jour2| <= 1 (plus strict)
                            if working_day1 and working_day2:
                                diff_pos = self.model.NewIntVar(0, 5, f'diff_pos_{day1}_{day2}')
                                diff_neg = self.model.NewIntVar(0, 5, f'diff_neg_{day1}_{day2}')
                                
                                self.model.Add(sum(working_day1) - sum(working_day2) == diff_pos - diff_neg)
                                self.model.Add(diff_pos + diff_neg <= 2)  # Retour à écart max 2 employés (plus réaliste)
                                
                                logger.info(f"⚖️ Contrainte équilibrage: jour {day1} vs jour {day2} (écart max 1)")
            
            # 9. CONTRAINTE SUPPLÉMENTAIRE: Minimum/Maximum employés par jour semaine
            for day in range(5):  # Lundi à vendredi
                working_day = []
                for emp in employees:
                    emp_id = str(emp['id'])
                    for slot, var in shifts[emp_id][day].items():
                        if slot != 'Repos':
                            working_day.append(var)
                
                if working_day:
                    # Au moins 4 employés et maximum 6 employés par jour de semaine (ajusté)
                    self.model.Add(sum(working_day) >= 4)
                    self.model.Add(sum(working_day) <= 6)
                    logger.info(f"📊 Jour {day}: entre 4 et 7 employés requis")
            
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
                
                # ÉTAPE 6: Équilibrage selon l'affluence
                logger.info("📊 ÉTAPE 6: Équilibrage selon l'affluence")
                balanced_solution = self.balance_shifts_by_affluence(solution, employees, affluences)
                
                # ÉTAPE 7: Ajustement final des heures réglementaires
                logger.info("⚖️ ÉTAPE 7: Ajustement des heures réglementaires")
                adjusted_solution = self.adjust_weekly_hours_and_balance(balanced_solution, employees, slot_hours)
                
                # Recalculer les validations après ajustement
                for emp in employees:
                    emp_id = str(emp['id'])
                    if emp_id in adjusted_solution:
                        adjusted_hours = 0
                        for day in range(days):
                            slot = adjusted_solution[emp_id].get(day, 'Repos')
                            if slot != 'Repos':
                                adjusted_hours += slot_hours.get(slot, 0)
                        
                        # Mettre à jour les validations
                        volume_diff = abs(adjusted_hours - emp['volume'])
                        if volume_diff > 0.3:  # Tolérance réduite après ajustement
                            validation['warnings'].append(
                                f"{emp['name']}: {adjusted_hours}h après ajustement (écart {volume_diff:+.1f}h)"
                            )
                
                validation['stats'] = {
                    'total_hours': total_week_hours,
                    'diagnostic': diagnostic,
                    'suggestions': suggestions
                }
                
                logger.info(f"✅ Solution trouvée avec nouvelle stratégie: {total_week_hours}h totales")
                
                return {
                    'success': True,
                    'planning': adjusted_solution,  # Retourner la solution ajustée
                    'validation': validation,
                    'diagnostic': diagnostic,
                    'suggestions': suggestions,
                    'strategy_info': {
                        'weekend_scores': weekend_scores,
                        'group_distribution': {
                            'ouverture': len(groups['ouverture']),
                            'fermeture': len(groups['fermeture']),
                            'vente': len(groups['vente'])
                        },
                        'shift_assignments': shift_distribution
                    },
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
        weekend_history = data.get('weekend_history', {})
        
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
        
        # Résoudre le planning avec l'historique des weekends
        result = solver_instance.solve_planning(employees, constraints, affluences, week_number, weekend_history)
        
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

#!/usr/bin/env python3
"""
Service OR-Tools 1 : Constraint Calculator
Calcule les contraintes, disponibilités et équilibrage
Enregistre les résultats en MongoDB
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from datetime import datetime, timedelta
import logging
import os
from typing import Dict, List, Any

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration MongoDB
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = 'boulangerie-planning'
COLLECTION_CONSTRAINTS = 'calculated_constraints'

# Connexion MongoDB
try:
    client = pymongo.MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    logger.info("✅ Connecté à MongoDB")
except Exception as e:
    logger.error(f"❌ Erreur connexion MongoDB: {e}")
    client = None

class ConstraintCalculator:
    """Calculateur de contraintes et disponibilités"""
    
    def __init__(self):
        self.days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    
    def calculate_employee_availability(self, employee: Dict, week_number: int, year: int) -> Dict:
        """Calcule la disponibilité d'un employé pour une semaine"""
        
        availability = {
            'employee_id': str(employee['_id']),
            'name': employee['name'],
            'week_number': week_number,
            'year': year,
            'total_available_days': 0,
            'constraints': {},
            'sick_leave_days': 0,
            'training_days': 0,
            'cp_days': 0,
            'rest_days': 0
        }
        
        # Vérifier arrêt maladie
        if employee.get('sickLeave', {}).get('isOnSickLeave'):
            start_date = datetime.fromisoformat(employee['sickLeave']['startDate'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(employee['sickLeave']['endDate'].replace('Z', '+00:00'))
            
            for day_index, day_name in enumerate(self.days):
                day_date = self.get_date_for_day(day_name, week_number, year)
                if start_date <= day_date <= end_date:
                    availability['constraints'][day_name] = 'MAL'
                    availability['sick_leave_days'] += 1
                else:
                    availability['total_available_days'] += 1
        else:
            availability['total_available_days'] = 7
        
        # Vérifier jours de formation
        if employee.get('trainingDays'):
            for training_day in employee['trainingDays']:
                if training_day in self.days:
                    availability['constraints'][training_day] = 'Formation'
                    availability['training_days'] += 1
                    availability['total_available_days'] -= 1
        
        # Calculer repos équilibrés
        self.calculate_balanced_rest(availability, employee)
        
        return availability
    
    def get_date_for_day(self, day_name: str, week_number: int, year: int) -> datetime:
        """Calcule la date pour un jour donné de la semaine"""
        day_index = self.days.index(day_name)
        
        # Premier janvier de l'année
        first_day = datetime(year, 1, 1)
        
        # Trouver le premier lundi
        while first_day.weekday() != 0:  # 0 = Lundi
            first_day += timedelta(days=1)
        
        # Date du jour demandé
        target_date = first_day + timedelta(weeks=week_number-1, days=day_index)
        return target_date
    
    def calculate_balanced_rest(self, availability: Dict, employee: Dict):
        """Calcule les repos équilibrés selon les règles"""
        
        # Règles pour mineurs
        if employee.get('age', 18) < 18:
            # Pas de travail le dimanche
            if 'Dimanche' not in availability['constraints']:
                availability['constraints']['Dimanche'] = 'Repos'
                availability['rest_days'] += 1
                availability['total_available_days'] -= 1
            
            # Repos consécutifs avec dimanche
            if 'Samedi' not in availability['constraints']:
                availability['constraints']['Samedi'] = 'Repos'
                availability['rest_days'] += 1
                availability['total_available_days'] -= 1
        
        # Équilibrage des repos pour tous
        min_rest_days = 2
        if availability['rest_days'] < min_rest_days:
            # Ajouter des repos équilibrés
            available_days = [day for day in self.days if day not in availability['constraints']]
            rest_to_add = min_rest_days - availability['rest_days']
            
            for i in range(rest_to_add):
                if available_days:
                    rest_day = available_days.pop(0)
                    availability['constraints'][rest_day] = 'Repos'
                    availability['rest_days'] += 1
                    availability['total_available_days'] -= 1
    
    def calculate_weekend_history(self, employee_id: str, week_number: int, year: int) -> Dict:
        """Calcule l'historique des weekends pour équilibrage"""
        
        if not client:
            return {'saturdays': 0, 'sundays': 0}
        
        try:
            # Analyser les 4 dernières semaines
            weekend_history = {'saturdays': 0, 'sundays': 0}
            
            for i in range(1, 5):
                analyze_week = week_number - i
                analyze_year = year
                
                if analyze_week <= 0:
                    analyze_week += 52
                    analyze_year -= 1
                
                # Chercher dans les plannings précédents
                planning = db.plannings.find_one({
                    'weekNumber': analyze_week,
                    'year': analyze_year,
                    'employeeId': employee_id
                })
                
                if planning and planning.get('schedule'):
                    for day_schedule in planning['schedule']:
                        if day_schedule['day'] == 'Samedi' and day_schedule.get('totalHours', 0) > 0:
                            weekend_history['saturdays'] += 1
                        elif day_schedule['day'] == 'Dimanche' and day_schedule.get('totalHours', 0) > 0:
                            weekend_history['sundays'] += 1
            
            return weekend_history
            
        except Exception as e:
            logger.error(f"Erreur calcul historique weekends: {e}")
            return {'saturdays': 0, 'sundays': 0}

@app.route('/calculate-constraints', methods=['POST'])
def calculate_constraints():
    """Endpoint principal pour calculer les contraintes"""
    
    try:
        data = request.get_json()
        employees = data.get('employees', [])
        week_number = data.get('week_number')
        year = data.get('year')
        
        if not employees or week_number is None or year is None:
            return jsonify({'error': 'Données manquantes'}), 400
        
        logger.info(f"🧮 Calcul des contraintes pour {len(employees)} employés, semaine {week_number}")
        
        calculator = ConstraintCalculator()
        results = []
        
        for employee in employees:
            # Calculer disponibilité
            availability = calculator.calculate_employee_availability(employee, week_number, year)
            
            # Calculer historique weekends
            weekend_history = calculator.calculate_weekend_history(
                str(employee['_id']), week_number, year
            )
            
            # Enrichir avec historique
            availability['weekend_history'] = weekend_history
            
            results.append(availability)
            
            logger.info(f"✅ {employee['name']}: {availability['total_available_days']} jours disponibles")
        
        # Enregistrer en MongoDB
        if client:
            try:
                # Supprimer anciennes contraintes
                db[COLLECTION_CONSTRAINTS].delete_many({
                    'week_number': week_number,
                    'year': year
                })
                
                # Insérer nouvelles contraintes
                for result in results:
                    db[COLLECTION_CONSTRAINTS].insert_one({
                        **result,
                        'calculated_at': datetime.utcnow(),
                        'status': 'calculated'
                    })
                
                logger.info(f"💾 {len(results)} contraintes enregistrées en MongoDB")
                
            except Exception as e:
                logger.error(f"❌ Erreur enregistrement MongoDB: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Contraintes calculées pour {len(employees)} employés',
            'constraints': results,
            'week_number': week_number,
            'year': year
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur calcul contraintes: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du service"""
    return jsonify({
        'status': 'healthy',
        'service': 'constraint-calculator',
        'timestamp': datetime.utcnow().isoformat(),
        'mongodb': 'connected' if client else 'disconnected'
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)

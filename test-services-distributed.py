#!/usr/bin/env python3
"""
Script de test pour les services distribués
Teste le calcul des contraintes et la génération du planning
"""

import requests
import json
from datetime import datetime

# Configuration des services
CONSTRAINT_SERVICE_URL = "http://localhost:5001"
PLANNING_SERVICE_URL = "http://localhost:5002"

# Données de test
test_employees = [
    {
        "_id": "test_emp_1",
        "name": "Anaïs Test",
        "age": 17,
        "weeklyHours": 35,
        "skills": ["vendeuse"],
        "trainingDays": ["Mercredi"],
        "sickLeave": {
            "isOnSickLeave": False
        }
    },
    {
        "_id": "test_emp_2", 
        "name": "Vanessa Test",
        "age": 18,
        "weeklyHours": 39,
        "skills": ["manager", "ouverture", "fermeture"],
        "trainingDays": [],
        "sickLeave": {
            "isOnSickLeave": True,
            "startDate": "2025-08-24T00:00:00Z",
            "endDate": "2025-09-07T00:00:00Z"
        }
    }
]

def test_constraint_calculator():
    """Teste le service de calcul des contraintes"""
    print("🧮 Test du Service Constraint Calculator...")
    
    try:
        # Test health check
        health_response = requests.get(f"{CONSTRAINT_SERVICE_URL}/health")
        if health_response.status_code == 200:
            print("✅ Health check OK")
        else:
            print(f"❌ Health check échoué: {health_response.status_code}")
            return False
        
        # Test calcul des contraintes
        constraints_data = {
            "employees": test_employees,
            "week_number": 36,
            "year": 2025
        }
        
        constraints_response = requests.post(
            f"{CONSTRAINT_SERVICE_URL}/calculate-constraints",
            json=constraints_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if constraints_response.status_code == 200:
            result = constraints_response.json()
            print("✅ Calcul des contraintes réussi")
            print(f"   - {len(result['constraints'])} contraintes calculées")
            
            # Afficher les contraintes
            for constraint in result['constraints']:
                print(f"   - {constraint['name']}: {constraint['total_available_days']} jours disponibles")
                if constraint['constraints']:
                    print(f"     Contraintes: {constraint['constraints']}")
            
            return True
        else:
            print(f"❌ Calcul des contraintes échoué: {constraints_response.status_code}")
            print(f"   Erreur: {constraints_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au service constraint-calculator")
        print("   Vérifiez qu'il est démarré sur le port 5001")
        return False
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_planning_generator():
    """Teste le service de génération du planning"""
    print("\n🚀 Test du Service Planning Generator...")
    
    try:
        # Test health check
        health_response = requests.get(f"{PLANNING_SERVICE_URL}/health")
        if health_response.status_code == 200:
            print("✅ Health check OK")
        else:
            print(f"❌ Health check échoué: {health_response.status_code}")
            return False
        
        # Test génération du planning
        planning_data = {
            "employees": test_employees,
            "week_number": 36,
            "year": 2025,
            "affluences": [2, 2, 2, 2, 2, 2, 2]  # Affluence faible tous les jours
        }
        
        planning_response = requests.post(
            f"{PLANNING_SERVICE_URL}/generate-planning",
            json=planning_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if planning_response.status_code == 200:
            result = planning_response.json()
            print("✅ Génération du planning réussie")
            print(f"   - Statut solveur: {result.get('solver_status', 'N/A')}")
            print(f"   - Temps de résolution: {result.get('solve_time', 'N/A')}s")
            
            if 'planning' in result:
                print("   - Planning généré:")
                for emp_id, schedule in result['planning'].items():
                    emp_name = next((emp['name'] for emp in test_employees if str(emp['_id']) == emp_id), emp_id)
                    print(f"     {emp_name}: {schedule}")
            
            return True
        else:
            print(f"❌ Génération du planning échouée: {planning_response.status_code}")
            print(f"   Erreur: {planning_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au service planning-generator")
        print("   Vérifiez qu'il est démarré sur le port 5002")
        return False
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🧪 TEST DES SERVICES DISTRIBUÉS")
    print("=" * 50)
    
    # Test des deux services
    constraint_ok = test_constraint_calculator()
    planning_ok = test_planning_generator()
    
    print("\n" + "=" * 50)
    print("📊 RÉSULTATS DES TESTS")
    print("=" * 50)
    
    if constraint_ok and planning_ok:
        print("🎉 TOUS LES TESTS SONT PASSÉS !")
        print("✅ Les services distribués fonctionnent correctement")
        print("🚀 Prêt pour le déploiement sur Render")
    else:
        print("❌ CERTAINS TESTS ONT ÉCHOUÉ")
        if not constraint_ok:
            print("   - Service Constraint Calculator: ❌")
        if not planning_ok:
            print("   - Service Planning Generator: ❌")
        print("\n🔧 Vérifiez que les services sont démarrés et accessibles")
    
    print("\n📋 PROCHAINES ÉTAPES:")
    print("1. Démarrer constraint-calculator: python constraint-calculator.py")
    print("2. Démarrer planning-generator: python planning-generator.py")
    print("3. Relancer ce script de test")
    print("4. Déployer sur Render avec les fichiers .yaml")

if __name__ == "__main__":
    main()

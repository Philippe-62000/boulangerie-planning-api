import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import api from '../services/api';

const AbsenceModal = ({ show, onHide, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ABS',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (show) {
      loadEmployees();
    }
  }, [show]);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      setError('Erreur lors du chargement des employés');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/absences', formData);
      onSuccess();
      onHide();
      setFormData({
        employeeId: '',
        type: 'ABS',
        startDate: '',
        endDate: '',
        reason: ''
      });
    } catch (error) {
      console.error('Erreur lors de la déclaration d\'absence:', error);
      setError(error.response?.data?.error || 'Erreur lors de la déclaration d\'absence');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Déclarer une absence</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Employé *</Form.Label>
            <Form.Select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} - {employee.role}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Type d'absence *</Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="ABS">Absence</option>
              <option value="MAL">Maladie</option>
              <option value="RET">Retard</option>
            </Form.Select>
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Date de début *</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Date de fin *</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Raison (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Précisez la raison de l'absence..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Déclaration...' : 'Déclarer l\'absence'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AbsenceModal;




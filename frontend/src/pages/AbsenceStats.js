import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Alert, Badge } from 'react-bootstrap';
import api from '../services/api';

const AbsenceStats = () => {
  const [stats, setStats] = useState([]);
  const [globalTotals, setGlobalTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: '',
    employeeId: ''
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadEmployees();
    loadStats();
  }, []);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);

      const response = await api.get(`/absences/stats?${params}`);
      setStats(response.data.stats);
      setGlobalTotals(response.data.globalTotals);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTypeBadge = (type) => {
    const variants = {
      'MAL': 'danger',
      'ABS': 'warning',
      'RET': 'info'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>📊 État des Absences</h2>
          <p className="text-muted">Statistiques détaillées des absences par employé</p>
        </Col>
      </Row>

      {/* Filtres */}
      <Card className="mb-4">
        <Card.Header>
          <h5>🔍 Filtres</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Période</Form.Label>
                <Form.Select
                  name="period"
                  value={filters.period}
                  onChange={handleFilterChange}
                >
                  <option value="day">Jour</option>
                  <option value="week">Semaine</option>
                  <option value="month">Mois</option>
                  <option value="year">Année</option>
                  <option value="custom">Personnalisé</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Employé</Form.Label>
                <Form.Select
                  name="employeeId"
                  value={filters.employeeId}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les employés</option>
                  {employees.map(employee => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date de début</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date de fin</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Totaux globaux */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{globalTotals.totalMal || 0}</h3>
              <p className="mb-0">Maladies</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{globalTotals.totalAbs || 0}</h3>
              <p className="mb-0">Absences</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{globalTotals.totalRet || 0}</h3>
              <p className="mb-0">Retards</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{globalTotals.totalAbsences || 0}</h3>
              <p className="mb-0">Total</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tableau des statistiques */}
      <Card>
        <Card.Header>
          <h5>📋 Détail par employé</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <p>Chargement des statistiques...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center">
              <p>Aucune donnée d'absence trouvée pour cette période.</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th className="text-center">Maladies</th>
                  <th className="text-center">Absences</th>
                  <th className="text-center">Retards</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Jours</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{stat.employeeName}</strong>
                    </td>
                    <td className="text-center">
                      <Badge bg="danger">{stat.malCount || 0}</Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg="warning">{stat.absCount || 0}</Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg="info">{stat.retCount || 0}</Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg="primary">{stat.totalAbsences || 0}</Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg="secondary">{stat.totalDays || 0}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AbsenceStats;




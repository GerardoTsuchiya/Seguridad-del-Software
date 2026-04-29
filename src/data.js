const users = [
  {
    id: 1,
    name: 'Ana Torres',
    email: 'ana.torres@example.com',
    role: 'admin'
  },
  {
    id: 2,
    name: 'Luis Martinez',
    email: 'luis.martinez@example.com',
    role: 'analyst'
  },
  {
    id: 3,
    name: 'Carla Ruiz',
    email: 'carla.ruiz@example.com',
    role: 'user'
  }
];

const roles = ['admin', 'analyst', 'user'];

const reports = {
  1: {
    month: 'Enero',
    incidents: 4,
    failedLogins: 18,
    status: 'Revisado'
  },
  2: {
    month: 'Febrero',
    incidents: 7,
    failedLogins: 31,
    status: 'Pendiente'
  },
  3: {
    month: 'Marzo',
    incidents: 2,
    failedLogins: 11,
    status: 'Revisado'
  }
};

module.exports = {
  users,
  roles,
  reports
};

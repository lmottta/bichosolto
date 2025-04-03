// Primeiro carregamos os modelos principais
const User = require('./User');
const Event = require('./Event');

// Depois carregamos os modelos que dependem deles
const Report = require('./Report');
const Animal = require('./Animal');
const Donation = require('./Donation');
const Volunteer = require('./Volunteer');

// Definição das associações entre os modelos

// Associações de User
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
User.hasMany(Animal, { foreignKey: 'userId', as: 'animals' });
User.hasMany(Animal, { foreignKey: 'adoptedBy', as: 'adoptedAnimals' });
User.hasMany(Event, { foreignKey: 'userId', as: 'events' });
User.hasMany(Donation, { foreignKey: 'donorId', as: 'donations' });
User.hasMany(Donation, { foreignKey: 'recipientId', as: 'receivedDonations' });
User.hasMany(Volunteer, { foreignKey: 'userId', as: 'volunteerActivities' });

// Associações de Report
Report.belongsTo(User, { foreignKey: 'userId', as: 'reporter' });

// Associações de Animal
Animal.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Animal.belongsTo(User, { foreignKey: 'adoptedBy', as: 'adopter' });

// Associações de Event
Event.belongsTo(User, { foreignKey: 'userId', as: 'organizer' });

// Associações de Donation
Donation.belongsTo(User, { foreignKey: 'donorId', as: 'donor' });
Donation.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// Associações de Volunteer
Volunteer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Tabela de junção para voluntários em eventos
Event.belongsToMany(Volunteer, { through: 'EventVolunteers', as: 'volunteers' });
Volunteer.belongsToMany(Event, { through: 'EventVolunteers', as: 'events' });

module.exports = {
  User,
  Report,
  Animal,
  Event,
  Donation,
  Volunteer,
};
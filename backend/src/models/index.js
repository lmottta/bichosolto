const User = require('./User');
const Report = require('./Report');
const Animal = require('./Animal');
const Event = require('./Event');
const Donation = require('./Donation');
const Volunteer = require('./Volunteer');

// Definição das associações entre os modelos

// Associações de User
User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
User.hasMany(Report, { foreignKey: 'assigned_to_id', as: 'assignedReports' });
User.hasMany(Animal, { foreignKey: 'user_id', as: 'animals' });
User.hasMany(Animal, { foreignKey: 'adopted_by', as: 'adoptedAnimals' });
User.hasMany(Event, { foreignKey: 'user_id', as: 'events' });
User.hasMany(Donation, { foreignKey: 'donor_id', as: 'donations' });
User.hasMany(Donation, { foreignKey: 'recipient_id', as: 'receivedDonations' });
User.hasOne(Volunteer, { foreignKey: 'user_id', as: 'volunteer' });

// Associações de Report
Report.belongsTo(User, { foreignKey: 'user_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignedTo' });

// Associações de Animal
Animal.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
Animal.belongsTo(User, { foreignKey: 'adopted_by', as: 'adopter' });

// Associações de Event
Event.belongsTo(User, { foreignKey: 'user_id', as: 'organizer' });

// Associações de Donation
Donation.belongsTo(User, { foreignKey: 'donor_id', as: 'donor' });
Donation.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });
Donation.belongsTo(Event, { foreignKey: 'campaign_id', as: 'campaign' });

// Associações de Volunteer
Volunteer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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
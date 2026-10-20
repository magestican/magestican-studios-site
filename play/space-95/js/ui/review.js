




const REVIEWS = {
  meets: {
    title: 'Meets expectations',
    line: 'Survey filed, ship repaired, crew home on time. HQ is satisfied. Clock off, you two.',
  },
  exceeds: {
    title: 'Exceeds expectations',
    line: 'A gold star on the file. And down on Galaxa Z, a very large child is waving goodbye to the ship.',
  },
  'employee-of-the-year': {
    title: 'Employees of the Year',
    line: 'Every last secret surveyed. The Vast have sent a gift into orbit - addressed to "the tiny ones". Open it?',
  },
};


export const reviewFor = (tier) => (tier ? REVIEWS[tier] : null);

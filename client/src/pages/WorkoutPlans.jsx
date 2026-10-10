import React from 'react';

const samplePlans = [
  {
    id: 1,
    name: 'Mountain Endurance',
    author: 'Coach Riley',
    level: 'Advanced',
    workouts: 6,
    duration: '8 weeks',
  },
  {
    id: 2,
    name: 'Trail Beginner',
    author: 'Coach Ana',
    level: 'Beginner',
    workouts: 3,
    duration: '4 weeks',
  },
];

export default function WorkoutPlans() {
  return (
    <div>
      <div className="sfa-plans-grid">
        {samplePlans.map((p) => (
          <div key={p.id} className="sfa-card sfa-plan-card">
            <div className="sfa-plan-head">
              <div>
                <h4 className="sfa-plan-name">{p.name}</h4>
                <div className="sfa-plan-author">by {p.author}</div>
              </div>
              <div className={`sfa-badge sfa-badge-${p.level.toLowerCase()}`}>{p.level}</div>
            </div>

            <div className="sfa-plan-stats">
              <div className="sfa-plan-stat"><b>{p.workouts}</b><span>Workouts</span></div>
              <div className="sfa-plan-stat"><b>{p.duration}</b><span>Duration</span></div>
              <div className="sfa-plan-stat"><b>—</b><span>Calories</span></div>
            </div>

            <div className="sfa-plan-foot">
              <div className="sfa-tag">Outdoor</div>
              <button className="sfa-link">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

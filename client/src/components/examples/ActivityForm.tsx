import { useState } from 'react';
import ActivityForm from '../ActivityForm';

export default function ActivityFormExample() {
  const [activity, setActivity] = useState({
    start_date: '2025-10-15',
    end_date: '2025-10-17',
    destination: 'Jakarta'
  });

  return <ActivityForm activity={activity} onChange={setActivity} />;
}

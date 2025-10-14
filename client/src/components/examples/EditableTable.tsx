import { useState } from 'react';
import EditableTable from '../EditableTable';

export default function EditableTableExample() {
  const [rows, setRows] = useState([
    {
      name: 'Riska',
      type: 'accommodation',
      subtype: 'hotel',
      amount: '5000',
      total_night: '2'
    },
    {
      name: 'Riska',
      type: 'transport',
      subtype: 'flight',
      amount: '4000000',
      total_night: '',
      transport_detail: 'transport_asal'
    }
  ]);

  return <EditableTable rows={rows} setRows={setRows} />;
}

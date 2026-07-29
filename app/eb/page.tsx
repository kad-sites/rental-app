'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

type Unit = {
  id: number;
  house: string;
  name: string;
  balance: number;
  totalConsumed: number;
  status: 'online' | 'offline';
};

export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmounts, setRechargeAmounts] = useState<Record<number, string>>({});

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/eb/units');
      const data = await res.json();
      setUnits(data);
    } catch (error) {
      console.error('Failed to fetch units', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    
    // Periodically fetch the latest dashboard data
    const dataInterval = setInterval(fetchUnits, 3000);

    // Periodically trigger the "background sync" process to simulate the cron job
    // (In production, this shouldn't be triggered by the frontend, but by a backend cron)
    const syncInterval = setInterval(async () => {
      try {
        await fetch('/api/eb/sync');
      } catch (e) {
        console.error('Sync failed', e);
      }
    }, 5000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const handleRechargeChange = (id: number, value: string) => {
    setRechargeAmounts(prev => ({ ...prev, [id]: value }));
  };

  const handleRecharge = async (id: number) => {
    const amount = rechargeAmounts[id];
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    try {
      const res = await fetch('/api/eb/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rechargeAmountRs: Number(amount) }),
      });

      if (res.ok) {
        setRechargeAmounts(prev => ({ ...prev, [id]: '' }));
        fetchUnits();
        
        // Find the unit name for the alert
        const rechargedUnit = units.find(u => u.id === id);
        const unitName = rechargedUnit ? rechargedUnit.name : 'the unit';
        
        alert(`Successfully recharged ${unitName} with ₹${amount}`);
      }
    } catch (error) {
      console.error('Recharge failed', error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

  // Group units by house
  const house119 = units.filter(u => u.house === 'House 119');
  const house42 = units.filter(u => u.house === 'House 42');

  const RATE_PER_UNIT = 8.5; // Rs 8.5 per kWh

  const renderTable = (houseUnits: Unit[]) => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Unit Name</th>
            <th>Status</th>
            <th>Available Balance</th>
            <th>Lifetime Consumed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {houseUnits.map((unit) => {
            const balanceRs = (unit.balance * RATE_PER_UNIT).toFixed(2);
            const consumedRs = (unit.totalConsumed * RATE_PER_UNIT).toFixed(2);
            
            return (
              <tr key={unit.id}>
                <td className={styles.unitName}>{unit.name}</td>
                <td>
                  <span className={`${styles.status} ${unit.status === 'online' ? styles.statusOnline : styles.statusOffline}`}>
                    {unit.status}
                  </span>
                </td>
                <td className={`${styles.dataValue} ${unit.balance <= 10 ? styles.low : ''}`}>
                  <div>{unit.balance.toFixed(2)} kWh</div>
                  <div className={styles.subtext}>₹{balanceRs} left</div>
                </td>
                <td className={styles.dataValue}>
                  <div>{unit.totalConsumed.toFixed(2)} kWh</div>
                  <div className={styles.subtext}>₹{consumedRs} total</div>
                </td>
                <td>
                <div className={styles.actionCell}>
                  <input 
                    type="number" 
                    placeholder="₹ Amount" 
                    className={styles.rechargeInput}
                    value={rechargeAmounts[unit.id] || ''}
                    onChange={(e) => handleRechargeChange(unit.id, e.target.value)}
                  />
                  <button 
                    className={styles.rechargeBtn}
                    onClick={() => handleRecharge(unit.id)}
                  >
                    Recharge
                  </button>
                </div>
              </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logoGroup}>
            <div className={styles.logoIcon}>⚡</div>
            <h1 className={styles.navTitle}>Kiraya<span className={styles.navTitleHighlight}>EB</span></h1>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        <section className={styles.houseSection}>
        <h2 className={styles.houseTitle}>House No: 119</h2>
        {renderTable(house119)}
      </section>

      <section className={styles.houseSection}>
        <h2 className={styles.houseTitle}>House No: 42</h2>
        {renderTable(house42)}
      </section>
    </main>
    </>
  );
}

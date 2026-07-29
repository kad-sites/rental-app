'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

type Unit = {
  id: number;
  house: string;
  name: string;
  tenantName?: string;
  balance: number;
  totalConsumed: number;
  status: 'online' | 'offline' | 'maintenance';
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

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to manually disconnect this meter? Power will be cut immediately.')) return;
    
    try {
      const res = await fetch('/api/eb/units/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchUnits();
        alert('Meter disconnected successfully.');
      }
    } catch (error) {
      console.error('Disconnect failed', error);
    }
  };

  const handleBypass = async (id: number, currentStatus: string) => {
    const isMaintenance = currentStatus === 'maintenance';
    const msg = isMaintenance 
      ? 'Are you sure you want to turn OFF bypass and disconnect power?' 
      : 'Enable Maintenance Bypass? This will turn power ON instantly for cleaning/repairs.';

    if (!confirm(msg)) return;
    
    try {
      const res = await fetch('/api/eb/units/bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchUnits();
        if (isMaintenance) {
          alert('Bypass turned OFF. Meter is now offline.');
        } else {
          alert('Maintenance mode activated. Power is ON.');
        }
      }
    } catch (error) {
      console.error('Bypass failed', error);
    }
  };

  const handleConnect = async (id: number) => {
    if (!confirm('Are you sure you want to manually connect this meter to the billing system? Power will be turned ON.')) return;
    
    try {
      const res = await fetch('/api/eb/units/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchUnits();
        alert('Meter connected successfully.');
      }
    } catch (error) {
      console.error('Connect failed', error);
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
                <td className={styles.unitName}>
                  {unit.tenantName ? `${unit.name} : ${unit.tenantName}` : unit.name}
                </td>
                <td>
                  <span className={`${styles.status} ${unit.status === 'online' ? styles.statusOnline : unit.status === 'maintenance' ? styles.statusMaintenance : styles.statusOffline}`}>
                    {unit.status}
                  </span>
                </td>
                <td className={`${styles.dataValue} ${unit.balance < 5 ? styles.critical : unit.balance < 10 ? styles.warning : ''}`}>
                  <div>{unit.balance.toFixed(2)} kWh</div>
                  <div className={styles.subtext}>₹{balanceRs} left</div>
                </td>
                <td className={styles.dataValue}>
                  <div>{unit.totalConsumed.toFixed(2)} kWh</div>
                  <div className={styles.subtext}>₹{consumedRs} total</div>
                </td>
                <td>
                <div className={styles.actionCell} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
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
                  {unit.status === 'offline' ? (
                    <button 
                      className={styles.connectBtn}
                      onClick={() => handleConnect(unit.id)}
                      title="Manually Connect Power"
                    >
                      Connect
                    </button>
                  ) : (
                    <button 
                      className={styles.disconnectBtn}
                      onClick={() => handleDisconnect(unit.id)}
                      title="Manually Disconnect Power"
                    >
                      Disconnect
                    </button>
                  )}
                  <button 
                    className={unit.status === 'maintenance' ? styles.activeBypassBtn : styles.bypassBtn}
                    onClick={() => handleBypass(unit.id, unit.status)}
                    disabled={unit.status === 'online'}
                    title={unit.status === 'maintenance' ? 'Turn Off Bypass' : 'Bypass Power for Maintenance'}
                  >
                    {unit.status === 'maintenance' ? 'Bypass Off' : 'Bypass'}
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

import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';

import TransactionModal from '@/components/transactions/TransactionModal.jsx';
import Sidebar from '@/components/layout/Sidebar.jsx';
import TopBar from '@/components/layout/TopBar.jsx';

export default function AppLayout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setModalOpen(false);
    setEditTransaction(null);
  }, []);

  const openEdit = useCallback((tx) => {
    setEditTransaction(tx);
    setModalOpen(false);
  }, []);

  const openAdd = useCallback(() => {
    setEditTransaction(null);
    setModalOpen(true);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <TopBar
          onAddClick={openAdd}
          refreshKey={refreshKey}
          onNotificationsChanged={() => setRefreshKey((k) => k + 1)}
        />
        <Outlet
          context={{
            openAddModal: openAdd,
            openEditModal: openEdit,
            refreshKey,
          }}
        />
      </div>
      {modalOpen && !editTransaction && (
        <TransactionModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
      {editTransaction && (
        <TransactionModal
          transaction={editTransaction}
          onClose={() => setEditTransaction(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

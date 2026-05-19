import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';

import AddTransactionModal from '@/components/transactions/AddTransactionModal.jsx';
import Sidebar from '@/components/layout/Sidebar.jsx';
import TopBar from '@/components/layout/TopBar.jsx';

export default function AppLayout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setModalOpen(false);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <TopBar onAddClick={() => setModalOpen(true)} />
        <Outlet
          context={{
            openAddModal: () => setModalOpen(true),
            refreshKey,
          }}
        />
      </div>
      {modalOpen && (
        <AddTransactionModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}

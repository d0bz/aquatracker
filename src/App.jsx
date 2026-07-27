import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import UserDashboard from './pages/UserDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import MeterUploadModal from './components/MeterUploadModal';
import BatchUploadModal from './components/BatchUploadModal';
import AddPropertyModal from './components/AddPropertyModal';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPreselectedMeterId, setUploadPreselectedMeterId] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) {
    return <Login />;
  }

  const handleOpenUploadModal = (meterId = null) => {
    setUploadPreselectedMeterId(meterId);
    setIsUploadModalOpen(true);
  };

  const handleReadingAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <Navbar />

      <div className="main-app-layout" style={{ maxWidth: 1280, width: '100%', margin: '0 auto', flex: 1, display: 'flex', gap: 16, padding: '20px 16px' }}>
        
        {/* Sidebar Menu */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenUploadModal={() => handleOpenUploadModal()}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenAddPropModal={() => setIsAddPropModalOpen(true)}
        />

        {/* Main Workspace Content Area */}
        <main className="main-workspace-content" style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'dashboard' || activeTab === 'properties' ? (
            user.role === 'owner' ? (
              <OwnerDashboard 
                key={refreshKey}
                onOpenUploadModal={handleOpenUploadModal} 
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
                onOpenAddPropModal={() => setIsAddPropModalOpen(true)} 
              />
            ) : (
              <UserDashboard 
                key={refreshKey}
                onOpenUploadModal={handleOpenUploadModal} 
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
              />
            )
          ) : activeTab === 'analytics' ? (
            <AnalyticsPage key={refreshKey} />
          ) : null}
        </main>

      </div>

      {/* OCR Scan Photo Upload Modal */}
      <MeterUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        preselectedMeterId={uploadPreselectedMeterId}
        onReadingAdded={handleReadingAdded}
      />

      {/* Batch Bunch Upload Modal */}
      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchReadingsAdded={handleReadingAdded}
      />

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddPropModalOpen}
        onClose={() => setIsAddPropModalOpen(false)}
        onPropertyAdded={handleReadingAdded}
      />

    </div>
  );
}

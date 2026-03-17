import React from 'react';
import { useAppState } from './hooks/useAppState';

// Components
import { GlobalHeader } from './components/GlobalHeader';
import { Toast } from './components/Toast';
import { LoadingOverlay } from './components/LoadingOverlay';

// Views
import { HomeView } from './views/HomeView';
import { CalculatorView } from './views/CalculatorView';
import { OrderFormView } from './views/OrderFormView';
import { OrdersDashboardView } from './views/OrdersDashboardView';
import { OrderDetailsView } from './views/OrderDetailsView';
import { OrderEditView } from './views/OrderEditView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ProductEditorView } from './views/ProductEditorView';
import { GlobalCategoryEditorView } from './views/GlobalCategoryEditorView';

const App: React.FC = () => {
  const state = useAppState();
  const { view, toastMsg, loading } = state;

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Global sticky header — always visible (except in public view) */}
      {!state.isPublicView && (
        <GlobalHeader view={view} isAdmin={state.isAdmin} navigate={state.navigate} logoutAdmin={state.logoutAdmin} />
      )}

      {/* Notifications */}
      <Toast message={toastMsg} show={!!toastMsg} />
      {loading && <LoadingOverlay />}

      {/* View Router */}
      {view === 'HOME' && <HomeView {...state} />}
      {view === 'CALCULATOR' && <CalculatorView {...state} />}
      {view === 'ORDER_FORM' && <OrderFormView {...state} />}
      {view === 'ORDERS_DASHBOARD' && <OrdersDashboardView {...state} />}
      {view === 'ORDER_DETAILS' && <OrderDetailsView {...state} isPublicView={state.isPublicView} />}
      {view === 'ORDER_EDIT' && <OrderEditView {...state} />}
      {view === 'ADMIN_LOGIN' && <AdminLoginView navigate={state.navigate} showToast={state.showToast} loginAsAdmin={state.loginAsAdmin} />}
      {view === 'ADMIN_DASHBOARD' && <AdminDashboardView {...state} />}
      {view === 'PRODUCT_EDITOR' && <ProductEditorView {...state} />}
      {view === 'GLOBAL_CATEGORY_EDITOR' && <GlobalCategoryEditorView {...state} />}
    </div>
  );
};

export default App;
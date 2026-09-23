import React, { createContext, useContext, useState, useEffect } from 'react';
import { disableWebPush } from '../services/webPush';
import { hasStoredSessionFor, logoutSession } from '../services/session';
import { setBackupPassword } from '../services/backupCredential';
import { useQuery } from '../db/useQuery.js';
import { queryAllShops, createShop, database } from '../db/queries.js';
import { getPlanLimits, removeLegacyDemoUsers } from '../services/localAuth.js';

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [currentShop, setCurrentShop] = useState(null);
  const [userRole, setUserRole] = useState(() => (localStorage.getItem('userRole') || 'manager').toLowerCase());
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Utilisateur');
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('currentUserId') || '');
  const [hasValidLocalSession, setHasValidLocalSession] = useState(false);
  const [initError, setInitError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Requête réactive sur toutes les boutiques (mise à jour automatique)
  const allShops = useQuery(queryAllShops());
  const availableShops = currentShop
    ? allShops.filter(shop => shop.accountId === currentShop.accountId)
    : allShops;

  useEffect(() => {
    async function init() {
      const storedShops = await queryAllShops().fetch();
      const storedShopId = localStorage.getItem('currentShopId');
      const storedUserId = localStorage.getItem('currentUserId');
      let localUser = null;
      if (storedUserId) {
        try { localUser = await database.get('local_users').find(storedUserId); }
        catch { localUser = null; }
      }
      const userShop = localUser ? storedShops.find(shop => shop.id === localUser.shopId) : null;
      const allowedShops = userShop
        ? storedShops.filter(shop => shop.accountId === userShop.accountId)
        : [];
      const selectedShop = allowedShops.find(shop => shop.id === storedShopId) || userShop || null;
      const validSession = Boolean(localUser?.isActive && selectedShop && hasStoredSessionFor(localUser.id));
      setCurrentShop(selectedShop);
      setHasValidLocalSession(validSession);
      if (validSession) localStorage.setItem('currentShopId', selectedShop.id);
      else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentShopId');
      }
      setIsInitialized(true);
    }
    void init().catch(setInitError);
  }, []);

  // Sélection automatique de la boutique quand les données sont chargées
  useEffect(() => {
    if (!isInitialized || allShops.length === 0) return;
    if (currentShop) return; // Ne pas écraser la sélection manuelle

    const storedShopId = localStorage.getItem('currentShopId');
    if (storedShopId) {
      const found = allShops.find(s => s.id === storedShopId);
      if (found) { setCurrentShop(found); return; }
    }
    setCurrentShop(allShops[0]);
  }, [allShops, isInitialized]);

  const switchShop = async (shopId) => {
    const shop = allShops.find(s => s.id === shopId) || await database.get('shops').find(shopId);
    if (shop) {
      setCurrentShop(shop);
      localStorage.setItem('currentShopId', shopId);
    }
  };

  const addShop = async (name, extraData = {}) => {
    if (!currentShop) throw new Error('Aucune boutique active.');
    const plan = getPlanLimits(currentShop.subscriptionPlan);
    if (availableShops.length >= plan.maxShops) {
      throw new Error(
        plan.id === 'standard'
          ? 'Le plan Standard comprend une seule boutique. Passez au plan Multi-boutiques pour en ajouter une.'
          : `Votre abonnement autorise jusqu’à ${plan.maxShops} boutiques.`
      );
    }
    const newShop = await createShop({
      name,
      ...extraData,
      subscription_plan: plan.id,
      account_id: currentShop.accountId,
    });
    const defaultCategories = ['Téléphones', 'Accessoires', 'Tablettes', 'Informatique', 'Audio', 'Autres'];
    await database.write(async () => {
      const records = defaultCategories.map(categoryName => database.get('categories').prepareCreate(category => {
        category.shopId = newShop.id;
        category.name = categoryName;
        category.synced = false;
      }));
      await database.batch(...records);
    });
    setCurrentShop(newShop);
    localStorage.setItem('currentShopId', newShop.id);
    return newShop;
  };

  const switchRole = (role, name, userId) => {
    role = role.toLowerCase();
    const displayName = name || (role === 'owner' ? 'Administrateur' : 'Gestionnaire');
    setUserRole(role);
    setUserName(displayName);
    setHasValidLocalSession(true);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', displayName);
    if (userId) { setCurrentUserId(userId); localStorage.setItem('currentUserId', userId); }
  };

  const logout = () => {
    void disableWebPush().catch(() => {});
    void logoutSession().catch(() => {});
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentShopId');
    sessionStorage.removeItem('encryption_pin');
    setBackupPassword('');
    setUserRole('manager');
    setUserName('Utilisateur');
    setCurrentUserId('');
    setHasValidLocalSession(false);
  };

  if (initError) throw initError;

  return (
    <ShopContext.Provider value={{
      currentShop,
      availableShops,
      userRole,
      userName,
      currentUserId,
      hasValidLocalSession,
      isInitialized,
      switchRole,
      switchShop,
      addShop,
      logout,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}

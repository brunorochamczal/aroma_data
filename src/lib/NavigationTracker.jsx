// src/lib/NavigationTracker.jsx - Versão simplificada (opcional)
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Por enquanto, apenas loga no console (depois podemos implementar analytics)
    useEffect(() => {
        if (isAuthenticated) {
            console.log('Navegação:', location.pathname);
            // Aqui você pode integrar com Google Analytics, etc.
        }
    }, [location, isAuthenticated]);

    return null;
}

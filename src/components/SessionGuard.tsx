import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationProvider';

const SessionGuard: React.FC = () => {
    const navigate = useNavigate();
    const { showError } = useNotification();
    const originalFetch = useRef(window.fetch);
    const isIntercepted = useRef(false);

    useEffect(() => {
        // Prevent multiple interceptors
        if (isIntercepted.current) return;
        isIntercepted.current = true;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch.current(...args);

                // Check for session expiry
                if (response.status === 401 || response.status === 403) {

                    // Ignore login and 2fa endpoints to prevent loops
                    const url = args[0]?.toString() || '';
                    if (!url.includes('/auth/login') && !url.includes('/auth/authorized-2fa')) {
                        showError("Session expired. Please log in again.");
                        navigate('/login', { replace: true });
                        // Optionally return a fake response to prevent app crashes before nav
                        return response;
                    }
                }

                return response;
            } catch (error) {
                throw error;
            }
        };

        // Cleanup
        return () => {
            window.fetch = originalFetch.current;
            isIntercepted.current = false;
        };
    }, [navigate, showError]);

    return null; // This component handles side effects only
};

export default SessionGuard;

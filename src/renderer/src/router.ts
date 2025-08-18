import { createRouter } from 'sv-router';
import Landing from './pages/Landing.svelte';

export const { p, navigate, isActive, route } = createRouter({
  '/': Landing
});

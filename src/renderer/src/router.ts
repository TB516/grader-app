import { createRouter } from 'sv-router';
import Home from './pages/Home.svelte';
import Results from './pages/Results.svelte';

export const { p, navigate, isActive, route } = createRouter({
  '/': Home,
  '/results': Results
});

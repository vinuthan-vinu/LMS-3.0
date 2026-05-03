import { CommonActions } from '@react-navigation/native';

/**
 * Find a navigator in the ancestry chain that declares `name` and dispatch navigate there.
 * Tab → Stack nesting: navigating to stack-only routes (Payments, Exams, AdminDashboard, …) from a tab screen
 * must run on the parent stack navigator, otherwise React Navigation resolves no route → no-op UX.
 *
 * If ancestry walk fails (e.g. getState/routeNames quirks on web), dispatch NAVIGATE on the outermost parent.
 *
 * @param {import('@react-navigation/native').NavigationProp<unknown>} navigation
 * @param {string} name
 * @param {object} [params]
 */
export function navigateToRoute(navigation, name, params) {
  if (!navigation) return;

  let current = navigation;
  const visited = new WeakSet();

  for (let depth = 0; depth < 12 && current; depth += 1) {
    if (visited.has(current)) break;
    visited.add(current);

    const routeNames = current.getState?.()?.routeNames;
    if (Array.isArray(routeNames) && routeNames.includes(name)) {
      current.navigate(name, params);
      return;
    }

    current = typeof current.getParent === 'function' ? current.getParent() : undefined;
  }

  let root = navigation;
  while (root?.getParent?.()) root = root.getParent();
  const dispatcher = root?.dispatch ?? navigation.dispatch;
  if (typeof dispatcher === 'function') {
    dispatcher(CommonActions.navigate({ name, params }));
  }
}

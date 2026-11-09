// Serves the static site built into dist-public.
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};

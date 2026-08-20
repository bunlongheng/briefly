import next from "eslint-config-next";

const config = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "public/**", "data/**"] },
  ...next,
  {
    rules: {
      // We sync from external systems (DOM-set theme, localStorage, fetched
      // alignment) on mount - that is the intended use of an effect here, so the
      // new set-state-in-effect rule is a false positive for these cases.
      "react-hooks/set-state-in-effect": "off",
      // Book covers are optional local files resolved at runtime with an onError
      // monogram fallback; next/image's optimizer doesn't fit that use.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;

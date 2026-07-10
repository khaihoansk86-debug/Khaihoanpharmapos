import globals from "globals";
export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];

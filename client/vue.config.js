const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
});

module.exports = {
    configureWebpack: {
        resolve: {
            fallback: {
                path: require.resolve("path-browserify"),
                os: require.resolve("os-browserify/browser"),
                crypto: require.resolve("crypto-browserify"),
                stream: require.resolve("stream-browserify"),
            },
        },
    },
};

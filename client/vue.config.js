const { defineConfig } = require("@vue/cli-service");
const Dotenv = require("dotenv-webpack");

module.exports = defineConfig({
    transpileDependencies: true,
    configureWebpack: {
        plugins: [
            new Dotenv({
                path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
                safe: true,
            }),
        ],
        resolve: {
            fallback: {
                path: require.resolve("path-browserify"),
                os: require.resolve("os-browserify/browser"),
                crypto: require.resolve("crypto-browserify"),
                stream: require.resolve("stream-browserify"),
            },
        },
    },
});

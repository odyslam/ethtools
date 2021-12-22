# Ethtools

Ethtools is a simple cloudflare worker that offers useful tools to Ethereum users and developers. Cloudflare workers are basically little programs (functions) that run when a specific API endpoint is invoked.

The project uses javascript, but other languages are supported asd well. Cloudflare workers are great because they leverage the Edge network of Cloudflare, thus offering better speeds than most providers.

The tools are either offered via an API call or via page UI. Metamask is used as the default provider, so ethtools never has access to users sensitive data.

Please visit https://ethtools.odyslam.com for an up-to-date list of avaialble tools.

## Contributing

Yes, please. Create an issue with your idea/suggestion or just submit a PR.

### Project Structure

`index.js`: Entrypoint file for the cloudflare worker. It also contains the HTML (and JS) code that is served to the user.
`webpack.config.js`: Used to pack the source files for the cloudflare worker. Wrangler needs this file to know how to package the various source files into a single bundle that will be run by the worker.
`wrangler.toml`: Configuration for our wrangler/Cloudflare worker setup.

### How to contribute
1. Fork the project and clone it to your dev machine
2. Create a new [cloudflare worker](https://developers.cloudflare.com/workers/get-started/guide) and install wrangler
3. Setup wrangler and connect it to your Cloudflare account
4. Run `wrangler dev` from inside the directory

## License

MIT License

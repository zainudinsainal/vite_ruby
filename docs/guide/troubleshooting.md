[project]: https://github.com/ElMassimo/vite_ruby
[GitHub Issues]: https://github.com/ElMassimo/vite_ruby/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
[GitHub Discussions]: https://github.com/ElMassimo/vite_ruby/discussions
[sourceCodeDir]: /config/#sourcecodedir
[watchAdditionalPaths]: /config/#watchadditionalpaths
[entrypointsDir]: /config/#entrypointsDir
[devServerConnectTimeout]: /config/#devserverconnecttimeout
[host]: /config/#host
[port]: /config/#port
[vite]: https://vitejs.dev/
[vite-plugin-ruby]: https://github.com/ElMassimo/vite_ruby/tree/main/vite-plugin-ruby
[viteBinPath]: /config/#vitebinpath
[docker example]: https://github.com/ElMassimo/vite_rails_docker_example
[Using Heroku]: /guide/deployment#using-heroku
[example app]: https://github.com/ElMassimo/vite_ruby/tree/main/examples/rails/vite.config.ts
[windi]: /guide/plugins.html#windi-css
[@vitejs/plugin-react-refresh]: https://www.npmjs.com/package/@vitejs/plugin-react-refresh
[tag helpers]: /guide/development.html#tag-helpers-🏷
[ulimit]: https://wilsonmar.github.io/maximum-limits/
[additionalEntrypoints]: /config/#additionalentrypoints
[advanced usage]: /guide/advanced

# Troubleshooting

This section lists a few common gotchas, and bugs introduced in the past.

Please skim through __before__ opening an [issue][GitHub Issues].

### Upgrading to v3 and now assets are failing to resolve

It's likely that you have a nested directory structure under <kbd>[entrypointsDir]</kbd>.

See the _[Migrating from v2](/guide/migrating-from-v2.html#nested-entrypoints-paths-must-be-explicit)_ section for more information.

### Assets inside sourceCodeDir are being bundled

This is the default behavior in v3, which simplifies referencing images and icons
using [tag helpers].

You can opt out by configuring <kbd>[additionalEntrypoints]</kbd>, see _[Advanced Usage]_.

### Missing executable error

Verify that both <kbd>[vite]</kbd> and <kbd>[vite-plugin-ruby]</kbd> are in `devDependencies` in your `package.json` and have been installed by running <kbd>bin/vite info</kbd>.

If you are using a non-standard setup, try configuring <kbd>[viteBinPath]</kbd>.

### Hot Module Refresh does not work for React

When using <kbd>[@vitejs/plugin-react-refresh]</kbd> in non-HTML entrypoints,
you must explicitly [register the HMR plugin](https://github.com/vitejs/vite/issues/1984#issuecomment-778289660).

A [<kbd>vite_react_refresh_tag</kbd> helper][tag helpers] is provided for your convenience:

```erb
  <%= vite_client_tag %>
  <%= vite_react_refresh_tag %>
  <%= vite_javascript_tag 'application' %>
```

### Making HMR work in Docker Compose

Using Vite.js with Docker Compose requires configuring [`VITE_RUBY_HOST`][host] in the services.

In the Rails service, it should match the [name of your Vite service](https://github.com/ElMassimo/vite_rails_docker_example/blob/main/docker-compose.yml#L13), and in the Vite service it should be [set to receive external requests](https://github.com/ElMassimo/vite_rails_docker_example/blob/main/docker-compose.yml#L27) (from the browser in the host) in order to perform HMR.

Refer to this [Docker example] for a working setup.

### Build not working in CI or Heroku

Make sure `devDependencies` are installed when precompiling assets in a CI.

Refer to the _[Using Heroku]_ section.

### Build is triggered when the dev server is running

First, verify that the dev server is reachable by starting a new console session and running:

```ruby
> ViteRuby.instance.dev_server_running?
```

If it returns `false`, try increasing the <kbd>[devServerConnectTimeout]</kbd>, restart the console and retry.
In systems with constrained resources the [default timeout][devServerConnectTimeout] might not be enough.

If that doesn't work, verify that the [host] and [port] configuration is correct.

### Requests to vite refuse to connect for `::1`

In systems where `localhost` [defaults to `::1`](https://github.com/ElMassimo/vite_ruby/discussions/89?converting=1#discussioncomment-843021) it might be necessary to configure <kbd>[host]</kbd> to explicitly use `127.0.0.1`, since that's what [Vite uses by default](https://github.com/vitejs/vite/pull/2977/files#diff-35ba301b85014a4bfaa9cad2d8e7eafa41c4e8c2ddd5c193182241d9a1542082R45-R47).

```json
  "development": {
    "host": "127.0.0.1",
    "port": 3036,
```

### Requests to vite sporadically return a 404 error response

[See above](/guide/troubleshooting.html#build-is-triggered-when-the-dev-server-is-running), it could be related to the <kbd>[devServerConnectTimeout]</kbd>.

### Requests to vite sporadically return a 500 error response

Check your `ulimit -n` to make sure the limit of file descriptors is not [too low][ulimit].

This is probably the case if you are seeing errors such as `#<Errno::EMFILE: Too many open files` along with `#<SocketError: Failed to open TCP connection`.

Follow [this article][ulimit] for information on how to increase the limit of file descriptors in your OS.

### Changes are not taken into account, build is skipped

Usually happens when importing code outside the <kbd>[sourceCodeDir]</kbd>.

Add a file path or dir glob in <kbd>[watchAdditionalPaths]</kbd> to ensure changes to those files trigger a new build.

### `vite` and `vite-plugin-ruby` were not installed

If you have run <kbd>bundle exec vite install</kbd>, check the output for errors.

### Tailwind CSS is slow to load

A project called [Windi CSS](https://github.com/windicss/windicss) addresses this pain point − I've created a [documentation website](http://windicss.netlify.app/).

A [plugin for Vite.js](https://github.com/windicss/vite-plugin-windicss) is available, and should allow you to get [insanely faster](https://twitter.com/antfu7/status/1361398324587163648) load times in comparison.

Check the [_Recommended Plugins_][windi] section for more information.

### Windi CSS does not detect changes to server templates

Ensure you're using `vite-plugin-windicss@0.9.5` or higher.

Check the [_Recommended Plugins_][windi] section for more information.

### esbuild: cannot execute binary file

This can happen when using mounted volumes in Docker, and attempting to run Vite from the host, or installing dependencies in the host and then trying to run Vite in the container.

Since `esbuild` relies on a `postinstall` script, and the architecture of the host usually does not match the architecture of the image, this means the binaries are not compatible.

Try reinstalling `esbuild` in the host or container—depending on where you intend to run it—to ensure it's built for the corresponding system architecture.

## Contact ✉️

Please visit [GitHub Issues] to report bugs you find, and [GitHub Discussions] to make feature requests, or to get help.

Don't hesitate to [⭐️ star the project][project] if you find it useful!

Using it in production? Always love to hear about it! 😃

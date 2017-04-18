Cme-web
==============

Core monitoring engine (CME) web application.

This project uses webpack to bundle the source files (Javascript and Stylus)
into packages served to web browsers to interact with the CME API layer.

It requires node and npm along with several dependencies.  See `package.json`
for the full list.

Setup
-----------------------

Clone the repository to an empty folder then install the dependencies.

```bash
you@your-machine[~:501] $ git clone git@cuscsgit01.smiths.net:Avalanche/Cme-web.git
you@your-machine[~:502] $ cd Cme-web
you@your-machine[~/Cme-web:503] $ npm install
```

Build for Development
-----------------------

Create a development/debugging release that includes comments, source maps and is
not minimized.  Note that this also uses webpack's `--watch` flag and will keep an
eye on the source files and rebuild if it sees changes.  Hit `ctrl-c` to stop watching.

```bash
you@your-machine[~/Cme-web:504] $ npm run build:dev
```

The built files can be packaged up into an archive (`.tgz`) using the `build/cme-web-build.sh` script.

```bash
you@your-machine[~/Cme-web:505] $ build/cme-web-build.sh
```

The package can be uploaded to AWS S3 (or elsewhere) for distribution and use to 
generate the application layer Docker containers.


Build for Production
-----------------------

Once things are working well (i.e., no debugging or minimal client side source tracing needed)
you can do a production build.

```bash
you@your-machine[~/Cme-web:506] $ npm run build
```

That does all the fancy work of minimizing and packaging the source modules.  Again, use the
`build/cme-web-build.sh` script to package into a tar archive and upload to some convenient
location for distribution.




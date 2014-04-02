clean:
	rm -rf {build,dist,selenium-server.jar}

package-all: package-win package-osx

package-win: build-win
	mkdir -p dist
	cd build/win; zip -r -D ../../dist/Klassis.zip .; cd ../..

package-osx: build-osx
	mkdir -p dist
	cd build/osx; zip -r -D ../../dist/Klassis.app.zip Klassis.app; cd ../..

build-all: build-windows build-osx

build-win: prepare
	mkdir -p build/win
	wget -c -O build/win/Klassis.zip http://dl.node-webkit.org/v0.9.2/node-webkit-v0.9.2-win-ia32.zip
	unzip -u build/win/Klassis.zip -d build/win/
	rm build/win/{nwsnapshot.exe,Klassis.zip}
	mv build/win/nw.exe build/win/Klassis.exe
	mkdir build/win/package.nw
	cp -r gui lib node_modules package.json selenium-server.jar build/win/package.nw

build-osx: prepare
	mkdir -p build/osx
	wget -c -O build/osx/Klassis.app.zip http://dl.node-webkit.org/v0.9.2/node-webkit-v0.9.2-osx-ia32.zip
	rm -rf build/osx/{node-webkit.app,Klassis.app}
	unzip -u build/osx/Klassis.app.zip -d build/osx/
	rm build/osx/{credits.html,nwsnapshot,Klassis.app.zip}
	mv build/osx/node-webkit.app build/osx/Klassis.app
	mkdir build/osx/Klassis.app/Contents/Resources/app.nw
	cp -r gui lib node_modules package.json selenium-server.jar build/osx/Klassis.app/Contents/Resources/app.nw

prepare:
	npm install
	wget -c -O selenium-server.jar https://selenium-release.storage.googleapis.com/2.40/selenium-server-standalone-2.40.0.jar

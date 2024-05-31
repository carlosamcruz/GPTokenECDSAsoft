# General Purpose Token - GPToken with Oracle & Soft ECDSA

This is a general purpose token project a fungible token with 9 functions;

# To Set the Project Up:

The following instructions will help you to setup the project from the current repo:

   ```
   Create a new React Project:

	npx create-react-app webgptokon --template typescript
	cd webgptokon
	npx scrypt-cli@latest init

		***In case its necessary apply the following commands:

		git init
		git add .
		git commit -m "Initialize project using Creat React App"
		npx scrypt-cli@latest init

   Delete from node_mudules folders:

	..\node_modules\bsv
	..\node_modules\scrypt-ts
	..\node_modules\node-polyfill-webpack-plugin   

   Copy from crack_scrypt_0.1.73 foder (in this repo)

	..\crack_scrypt_0.1.73\bsv
	..\crack_scrypt_0.1.73\scrypt-ts
	..\crack_scrypt_0.1.73\node-polyfill-webpack-plugin
	..\crack_scrypt_0.1.73\filter-obj   
   
   Paste the four folders above into node_modules

	..\node_modules\bsv
	..\node_modules\scrypt-ts
	..\node_modules\node-polyfill-webpack-plugin
	..\node_modules\filter-obj

   Delete from projeto folder webgptokon:

	..\webgptokon\scr

   Copy folder (in this repo):

	src

   Paste it into project folder:

	..\webgptokon\scr   

   Compile the Project Contracts:

	npx scrypt-cli@latest compile

   Run it in your pc:

	npm start   

   ```

"# GPToken with Oracle & Soft ECDSA" 

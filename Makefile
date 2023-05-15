SHELL=/bin/bash

ssh_user=ak
config=~/fakedns	

sync:
	@rsync -avhr --delete --progress \
		./ $(ssh_user)@artemis:$(config)

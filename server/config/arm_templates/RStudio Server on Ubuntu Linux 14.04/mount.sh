USERACCOUNT=$1
sudo mkdir -p /mnt/userdrive;sudo mount -t cifs //your-storage-account-here.file.core.windows.net/users/$USERACCOUNT /mnt/userdrive -o sec=ntlm,vers=3.0,username=username,password=password,dir_mode=0777,file_mode=0777,dir_mode=0777,file_mode=0777 & printf "//your-storage-account-here.file.core.windows.net/users/"$USERACCOUNT" /mnt/userdrive cifs sec=ntlm,vers=3.0,username=username,password=password,dir_mode=0777,file_mode=0777" >> /etc/fstab; 
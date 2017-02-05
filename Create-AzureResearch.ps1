https://technet.microsoft.com/en-us/windows-server-docs/compute/hyper-v/best-practices-for-running-linux-on-hyper-v?f=255&MSPPError=-2147217396

New-VHD -Path C:\Hyper-v\vhdx\linux.vhdx -SizeBytes 127GB -Dynamic -BlockSizeBytes 1MB

# When creating the filesystem specify the number of groups to be 4096, for example:
# e.g.  mkfs.ext4 -G 4096 /dev/sdX1
# Because of legacy hardware being removed from emulation in Generation 2 virtual machines, the grub menu countdown timer counts down too quickly for the grub menu to be displayed, immediately loading the default entry. Until grub is fixed to use the EFI-supported timer, modify /boot/grub/grub.conf /etc/default/grub, or equivalent to have "timeout=100000" instead of the default "timeout=5"
# Download ubuntu from https://www.ubuntu.com/download/server


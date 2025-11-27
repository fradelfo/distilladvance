# System Administration Skill

Advanced system administration and infrastructure management expertise covering Linux administration, network configuration, security hardening, monitoring, and automation.

## Skill Overview

Expert system administration knowledge including Linux/Unix systems, network infrastructure, security hardening, performance tuning, backup strategies, disaster recovery, and infrastructure automation using modern tools and practices.

## Core Capabilities

### Linux System Administration
- **System configuration** - Systemd services, kernel tuning, resource management
- **Package management** - APT, YUM, DNF, Flatpak, Snap package systems
- **User management** - LDAP integration, SSH key management, privilege escalation
- **File systems** - ZFS, Btrfs, LVM, RAID configuration, encryption

### Network Administration
- **Network protocols** - TCP/IP, DNS, DHCP, routing, VLANs, VPNs
- **Firewall management** - iptables, nftables, UFW, fail2ban configuration
- **Load balancing** - HAProxy, NGINX, Traefik, traffic distribution
- **Network monitoring** - Wireshark, tcpdump, network performance analysis

### Security & Hardening
- **Security benchmarks** - CIS hardening, NIST guidelines, compliance automation
- **Access control** - SELinux, AppArmor, RBAC implementation
- **Certificate management** - Let's Encrypt, PKI infrastructure, TLS configuration
- **Intrusion detection** - OSSEC, Suricata, log analysis, threat hunting

### Monitoring & Observability
- **System monitoring** - Prometheus, Grafana, Zabbix, Nagios configuration
- **Log management** - ELK stack, Fluentd, centralized logging, analysis
- **Performance tuning** - Resource optimization, bottleneck identification
- **Alerting systems** - PagerDuty, Slack integration, escalation policies

## Modern System Administration Implementation

### Advanced Linux System Configuration
```bash
#!/bin/bash
# Comprehensive Linux hardening and optimization script
# Based on CIS benchmarks and security best practices

set -euo pipefail

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/system_hardening.log"
BACKUP_DIR="/etc/backup/$(date +%Y%m%d_%H%M%S)"

# Logging function
log_message() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log_message "ERROR" "$1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root"
    fi
}

# Backup configuration files
backup_configs() {
    log_message "INFO" "Creating backup of configuration files"

    mkdir -p "$BACKUP_DIR"

    # Important config files to backup
    local config_files=(
        "/etc/ssh/sshd_config"
        "/etc/sudoers"
        "/etc/pam.d/"
        "/etc/security/"
        "/etc/sysctl.conf"
        "/etc/fstab"
        "/etc/hosts"
        "/etc/hostname"
        "/etc/passwd"
        "/etc/shadow"
        "/etc/group"
        "/etc/gshadow"
        "/etc/login.defs"
    )

    for config in "${config_files[@]}"; do
        if [[ -e "$config" ]]; then
            cp -r "$config" "$BACKUP_DIR/"
            log_message "INFO" "Backed up $config"
        fi
    done
}

# System updates and package management
update_system() {
    log_message "INFO" "Updating system packages"

    # Detect package manager
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get upgrade -y
        apt-get autoremove -y
        apt-get autoclean

        # Install essential security tools
        apt-get install -y \
            fail2ban \
            ufw \
            aide \
            rkhunter \
            chkrootkit \
            lynis \
            unattended-upgrades \
            apt-listchanges

    elif command -v yum >/dev/null 2>&1; then
        yum update -y
        yum install -y epel-release
        yum install -y \
            fail2ban \
            firewalld \
            aide \
            rkhunter \
            lynis \
            yum-cron

    elif command -v dnf >/dev/null 2>&1; then
        dnf update -y
        dnf install -y \
            fail2ban \
            firewalld \
            aide \
            rkhunter \
            lynis \
            dnf-automatic
    fi

    log_message "INFO" "System update completed"
}

# Configure automatic security updates
configure_auto_updates() {
    log_message "INFO" "Configuring automatic security updates"

    if [[ -f /etc/apt/apt.conf.d/50unattended-upgrades ]]; then
        cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF

        echo 'APT::Periodic::Update-Package-Lists "1";' > /etc/apt/apt.conf.d/20auto-upgrades
        echo 'APT::Periodic::Unattended-Upgrade "1";' >> /etc/apt/apt.conf.d/20auto-upgrades

        systemctl enable unattended-upgrades
        systemctl start unattended-upgrades
    fi

    log_message "INFO" "Automatic updates configured"
}

# SSH hardening
harden_ssh() {
    log_message "INFO" "Hardening SSH configuration"

    local ssh_config="/etc/ssh/sshd_config"

    # Create hardened SSH config
    cat > "$ssh_config" << 'EOF'
# SSH Daemon configuration - Security hardened

# Protocol and encryption
Protocol 2
Port 2222
AddressFamily inet
ListenAddress 0.0.0.0

# Host keys
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Encryption algorithms
KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521,ecdh-sha2-nistp384,ecdh-sha2-nistp256,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,diffie-hellman-group14-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Connection settings
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60
MaxAuthTries 3
MaxSessions 4
MaxStartups 10:30:60

# Access control
AllowUsers sysadmin
DenyUsers root
DenyGroups root

# Features
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
GatewayPorts no
PermitTunnel no
PermitUserEnvironment no

# Logging
SyslogFacility AUTH
LogLevel INFO

# Banner
Banner /etc/issue.net
EOF

    # Create warning banner
    cat > /etc/issue.net << 'EOF'
***************************************************************************
                            WARNING
***************************************************************************
This system is for the use of authorized users only. Individuals using
this computer system without authority, or in excess of their authority,
are subject to having all of their activities on this system monitored
and recorded by system personnel.

In the course of monitoring individuals improperly using this system, or
in the course of system maintenance, the activities of authorized users
may also be monitored.

Anyone using this computer consents to such monitoring and is advised
that if such monitoring reveals possible evidence of criminal activity,
system personnel may provide the evidence to law enforcement officials.
***************************************************************************
EOF

    # Regenerate SSH host keys with stronger algorithms
    rm -f /etc/ssh/ssh_host_*
    ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N ""
    ssh-keygen -t ecdsa -b 521 -f /etc/ssh/ssh_host_ecdsa_key -N ""
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""

    # Set proper permissions
    chmod 600 /etc/ssh/ssh_host_*_key
    chmod 644 /etc/ssh/ssh_host_*_key.pub

    # Test SSH configuration
    if sshd -t; then
        systemctl reload sshd
        log_message "INFO" "SSH hardening completed successfully"
    else
        error_exit "SSH configuration test failed"
    fi
}

# Kernel and system hardening
harden_kernel() {
    log_message "INFO" "Applying kernel hardening settings"

    # Create sysctl security configuration
    cat > /etc/sysctl.d/99-security.conf << 'EOF'
# Kernel hardening configuration

# Network security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# IPv6 security
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Memory protection
kernel.randomize_va_space = 2
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.kexec_load_disabled = 1
kernel.yama.ptrace_scope = 1

# File system security
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
kernel.core_uses_pid = 1

# Network performance and security
net.core.netdev_max_backlog = 5000
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr

# System limits
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

    # Apply sysctl settings
    sysctl -p /etc/sysctl.d/99-security.conf

    log_message "INFO" "Kernel hardening applied"
}

# Firewall configuration
configure_firewall() {
    log_message "INFO" "Configuring firewall"

    if command -v ufw >/dev/null 2>&1; then
        # UFW configuration (Ubuntu/Debian)
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing

        # Allow essential services
        ufw allow 2222/tcp comment 'SSH'
        ufw allow 80/tcp comment 'HTTP'
        ufw allow 443/tcp comment 'HTTPS'

        # Rate limiting for SSH
        ufw limit 2222/tcp

        ufw --force enable

    elif command -v firewall-cmd >/dev/null 2>&1; then
        # FirewallD configuration (RHEL/CentOS)
        systemctl enable firewalld
        systemctl start firewalld

        firewall-cmd --permanent --remove-service=ssh
        firewall-cmd --permanent --add-port=2222/tcp
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https

        firewall-cmd --reload
    fi

    log_message "INFO" "Firewall configuration completed"
}

# Fail2ban configuration
configure_fail2ban() {
    log_message "INFO" "Configuring Fail2ban"

    # Create jail configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban settings
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

# Email notifications
destemail = admin@example.com
sendername = Fail2Ban
mta = sendmail

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    systemctl enable fail2ban
    systemctl start fail2ban

    log_message "INFO" "Fail2ban configuration completed"
}

# User and access control
configure_users() {
    log_message "INFO" "Configuring user accounts and access control"

    # Create admin user if not exists
    if ! id "sysadmin" &>/dev/null; then
        useradd -m -s /bin/bash -G sudo sysadmin
        log_message "INFO" "Created sysadmin user"
    fi

    # Set password policy
    cat > /etc/login.defs << 'EOF'
MAIL_DIR        /var/mail
FAILLOG_ENAB    yes
LOG_UNKFAIL_ENAB    no
LOG_OK_LOGINS   no
SYSLOG_SU_ENAB  yes
SYSLOG_SG_ENAB  yes
TTYPERM         0600
ENV_SUPATH      PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV_PATH        PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
TTYGROUP        tty
UMASK           027
USERGROUPS_ENAB yes
CONSOLE_GROUPS  floppy:audio:cdrom
DEFAULT_HOME    yes
PASS_MAX_DAYS   90
PASS_MIN_DAYS   1
PASS_WARN_AGE   7
PASS_MIN_LEN    8
UID_MIN         1000
UID_MAX         60000
SYS_UID_MIN     100
SYS_UID_MAX     999
GID_MIN         1000
GID_MAX         60000
SYS_GID_MIN     100
SYS_GID_MAX     999
LOGIN_RETRIES   3
LOGIN_TIMEOUT   60
CHFN_RESTRICT   rwh
ENCRYPT_METHOD  SHA512
EOF

    # Configure PAM for password complexity
    if [[ -f /etc/pam.d/common-password ]]; then
        sed -i 's/pam_unix.so.*/pam_unix.so sha512 shadow nullok minlen=8/' /etc/pam.d/common-password
        sed -i '/pam_unix.so/a password required pam_pwquality.so retry=3 minlen=8 difok=3 ucredit=-1 lcredit=-1 dcredit=-1 ocredit=-1' /etc/pam.d/common-password
    fi

    # Disable unused accounts
    local unused_accounts=("games" "news" "uucp" "proxy" "www-data" "backup" "list" "irc" "gnats" "nobody")
    for account in "${unused_accounts[@]}"; do
        if id "$account" &>/dev/null; then
            usermod -L -s /usr/sbin/nologin "$account"
            log_message "INFO" "Disabled account: $account"
        fi
    done

    log_message "INFO" "User configuration completed"
}

# File system hardening
harden_filesystem() {
    log_message "INFO" "Hardening file system"

    # Set proper permissions on important files
    chmod 600 /etc/shadow
    chmod 600 /etc/gshadow
    chmod 644 /etc/passwd
    chmod 644 /etc/group
    chmod 600 /boot/grub/grub.cfg 2>/dev/null || true

    # Remove SUID/SGID from unnecessary files
    local suid_files=(
        "/usr/bin/chage"
        "/usr/bin/gpasswd"
        "/usr/bin/wall"
        "/usr/bin/chfn"
        "/usr/bin/chsh"
        "/usr/bin/newgrp"
        "/usr/bin/expiry"
    )

    for file in "${suid_files[@]}"; do
        if [[ -f "$file" ]]; then
            chmod u-s "$file"
            log_message "INFO" "Removed SUID from $file"
        fi
    done

    # Configure /tmp with nodev, nosuid, noexec
    if ! grep -q "/tmp" /etc/fstab; then
        echo "tmpfs /tmp tmpfs defaults,nodev,nosuid,noexec,size=2G 0 0" >> /etc/fstab
        log_message "INFO" "Configured secure /tmp mount"
    fi

    # Set sticky bit on world-writable directories
    find / -type d \( -path /proc -o -path /sys -o -path /dev \) -prune -o -type d -perm -002 -exec chmod +t {} \; 2>/dev/null

    log_message "INFO" "File system hardening completed"
}

# Install and configure AIDE (Advanced Intrusion Detection Environment)
configure_aide() {
    log_message "INFO" "Configuring AIDE intrusion detection"

    # Initialize AIDE database
    if command -v aideinit >/dev/null 2>&1; then
        aideinit
        mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
    elif command -v aide >/dev/null 2>&1; then
        aide --init
        mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
    fi

    # Create AIDE check script
    cat > /usr/local/bin/aide-check.sh << 'EOF'
#!/bin/bash
# AIDE integrity check script

AIDE_LOG="/var/log/aide.log"
AIDE_REPORT="/tmp/aide_report_$(date +%Y%m%d_%H%M%S).txt"

# Run AIDE check
if command -v aide >/dev/null 2>&1; then
    aide --check > "$AIDE_REPORT" 2>&1
    AIDE_EXIT=$?
else
    echo "AIDE not found" > "$AIDE_REPORT"
    AIDE_EXIT=1
fi

# Log results
echo "[$(date)] AIDE check completed with exit code $AIDE_EXIT" >> "$AIDE_LOG"

# Send email if changes detected
if [[ $AIDE_EXIT -ne 0 ]]; then
    cat "$AIDE_REPORT" | mail -s "AIDE Alert: File system changes detected on $(hostname)" admin@example.com
fi

# Clean up old reports
find /tmp -name "aide_report_*" -mtime +7 -delete
EOF

    chmod +x /usr/local/bin/aide-check.sh

    # Schedule AIDE checks
    cat > /etc/cron.d/aide << 'EOF'
# AIDE integrity checks
0 2 * * * root /usr/local/bin/aide-check.sh
EOF

    log_message "INFO" "AIDE configuration completed"
}

# System monitoring setup
configure_monitoring() {
    log_message "INFO" "Configuring system monitoring"

    # Install and configure Prometheus Node Exporter
    if ! command -v node_exporter >/dev/null 2>&1; then
        local version="1.6.1"
        local arch="linux-amd64"

        cd /tmp
        wget "https://github.com/prometheus/node_exporter/releases/download/v${version}/node_exporter-${version}.${arch}.tar.gz"
        tar xzf "node_exporter-${version}.${arch}.tar.gz"
        mv "node_exporter-${version}.${arch}/node_exporter" /usr/local/bin/

        # Create node_exporter user
        useradd --no-create-home --shell /bin/false node_exporter

        # Create systemd service
        cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \
    --collector.systemd \
    --collector.processes \
    --no-collector.mdadm

[Install]
WantedBy=multi-user.target
EOF

        systemctl daemon-reload
        systemctl enable node_exporter
        systemctl start node_exporter

        log_message "INFO" "Node Exporter installed and started"
    fi

    # Configure log rotation
    cat > /etc/logrotate.d/system-hardening << 'EOF'
/var/log/system_hardening.log {
    weekly
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF

    log_message "INFO" "Monitoring configuration completed"
}

# Security auditing tools
configure_security_tools() {
    log_message "INFO" "Configuring security auditing tools"

    # Configure rkhunter
    if command -v rkhunter >/dev/null 2>&1; then
        rkhunter --update
        rkhunter --propupd

        # Schedule weekly rkhunter scans
        cat > /etc/cron.weekly/rkhunter << 'EOF'
#!/bin/bash
# Weekly rkhunter scan

/usr/bin/rkhunter --cronjob --update --quiet
EOF
        chmod +x /etc/cron.weekly/rkhunter
    fi

    # Configure lynis
    if command -v lynis >/dev/null 2>&1; then
        # Create lynis audit script
        cat > /usr/local/bin/lynis-audit.sh << 'EOF'
#!/bin/bash
# Lynis security audit script

AUDIT_LOG="/var/log/lynis-$(date +%Y%m%d).log"

lynis audit system --quiet --log-file "$AUDIT_LOG"

# Extract summary and send email
grep -A 20 "Lynis security scan details:" "$AUDIT_LOG" | \
    mail -s "Lynis Security Audit Report - $(hostname)" admin@example.com
EOF
        chmod +x /usr/local/bin/lynis-audit.sh

        # Schedule monthly lynis audits
        cat > /etc/cron.monthly/lynis << 'EOF'
#!/bin/bash
/usr/local/bin/lynis-audit.sh
EOF
        chmod +x /etc/cron.monthly/lynis
    fi

    log_message "INFO" "Security tools configuration completed"
}

# Network security configuration
configure_network_security() {
    log_message "INFO" "Configuring network security"

    # Configure hosts.deny and hosts.allow
    cat > /etc/hosts.deny << 'EOF'
ALL: ALL
EOF

    cat > /etc/hosts.allow << 'EOF'
sshd: 192.168.1.0/24
sshd: 10.0.0.0/8
sshd: 172.16.0.0/12
EOF

    # Install and configure portsentry
    if command -v portsentry >/dev/null 2>&1; then
        cat > /etc/portsentry/portsentry.conf << 'EOF'
TCP_PORTS="1,7,9,11,15,70,79,80,109,110,111,119,138,139,143,512,513,514,515,540,635,1080,1524,2000,2001,4000,4001,5742,6000,6001,6667,12345,12346,20034,27665,31337,32771,32772,32773,32774,40421,49724,54320"
UDP_PORTS="1,7,9,66,67,68,69,111,137,138,161,162,474,513,517,518,635,640,641,700,2049,31337,54321"

ADVANCED_PORTS_TCP="1024"
ADVANCED_PORTS_UDP="1024"

ADVANCED_EXCLUDE_TCP="113,139"
ADVANCED_EXCLUDE_UDP="520,138,137,67"

IGNORE_FILE="/etc/portsentry/portsentry.ignore"
HISTORY_FILE="/var/lib/portsentry/portsentry.history"
BLOCKED_FILE="/var/lib/portsentry/portsentry.blocked"

RESOLVE_HOST = "0"
BLOCK_UDP="1"
BLOCK_TCP="1"

KILL_ROUTE="/sbin/iptables -I INPUT -s $TARGET$ -j DROP"
KILL_HOSTS_DENY="ALL: $TARGET$ : DENY"
EOF

        systemctl enable portsentry
        systemctl start portsentry
    fi

    log_message "INFO" "Network security configuration completed"
}

# Backup configuration
configure_backups() {
    log_message "INFO" "Configuring backup system"

    # Create backup script
    cat > /usr/local/bin/system-backup.sh << 'EOF'
#!/bin/bash
# System configuration backup script

BACKUP_BASE="/backup/system"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE/$BACKUP_DATE"
LOG_FILE="/var/log/system-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_backup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_backup "Starting system backup to $BACKUP_DIR"

# Backup configuration files
CONFIGS=(
    "/etc"
    "/root"
    "/var/log"
    "/usr/local/bin"
    "/opt"
    "/home"
)

for config in "${CONFIGS[@]}"; do
    if [[ -d "$config" ]]; then
        log_backup "Backing up $config"
        tar -czf "$BACKUP_DIR/$(basename $config)-backup.tar.gz" "$config" 2>/dev/null
    fi
done

# Backup package list
if command -v dpkg >/dev/null 2>&1; then
    dpkg --get-selections > "$BACKUP_DIR/package-list.txt"
elif command -v rpm >/dev/null 2>&1; then
    rpm -qa > "$BACKUP_DIR/package-list.txt"
fi

# Backup crontabs
cp -r /var/spool/cron "$BACKUP_DIR/cron-backup" 2>/dev/null || true

# Create system info file
cat > "$BACKUP_DIR/system-info.txt" << SYSEOF
Hostname: $(hostname)
OS: $(cat /etc/os-release | grep PRETTY_NAME)
Kernel: $(uname -a)
Uptime: $(uptime)
Memory: $(free -h)
Disk: $(df -h)
Network: $(ip addr show)
SYSEOF

# Cleanup old backups (keep 30 days)
find "$BACKUP_BASE" -type d -name "202*" -mtime +30 -exec rm -rf {} \; 2>/dev/null

log_backup "System backup completed successfully"

# Compress backup directory
tar -czf "$BACKUP_BASE/system-backup-$BACKUP_DATE.tar.gz" -C "$BACKUP_BASE" "$BACKUP_DATE"
rm -rf "$BACKUP_DIR"

log_backup "Backup compressed and stored as system-backup-$BACKUP_DATE.tar.gz"
EOF

    chmod +x /usr/local/bin/system-backup.sh

    # Schedule daily backups
    cat > /etc/cron.daily/system-backup << 'EOF'
#!/bin/bash
/usr/local/bin/system-backup.sh
EOF
    chmod +x /etc/cron.daily/system-backup

    log_message "INFO" "Backup system configured"
}

# Main function
main() {
    log_message "INFO" "Starting system hardening process"

    check_root
    backup_configs
    update_system
    configure_auto_updates
    harden_ssh
    harden_kernel
    configure_firewall
    configure_fail2ban
    configure_users
    harden_filesystem
    configure_aide
    configure_monitoring
    configure_security_tools
    configure_network_security
    configure_backups

    log_message "INFO" "System hardening completed successfully"
    log_message "INFO" "Please review the configuration and reboot the system"

    # Generate final report
    cat << EOF

================================================================================
                        SYSTEM HARDENING COMPLETE
================================================================================

The following security measures have been implemented:

1. System Updates:
   - All packages updated to latest versions
   - Automatic security updates configured
   - Security tools installed

2. SSH Hardening:
   - SSH port changed to 2222
   - Root login disabled
   - Password authentication disabled
   - Strong encryption algorithms enforced

3. Kernel Hardening:
   - Network security parameters configured
   - Memory protection enabled
   - File system security enhanced

4. Firewall Configuration:
   - Default deny policy implemented
   - Essential services allowed
   - Rate limiting configured

5. User Security:
   - Admin user created
   - Password policies enforced
   - Unused accounts disabled

6. File System Security:
   - Proper permissions set
   - SUID/SGID bits removed from unnecessary files
   - Secure mount options configured

7. Monitoring and Auditing:
   - AIDE intrusion detection configured
   - Log monitoring implemented
   - Security scanning tools configured

8. Backup System:
   - Automated daily backups configured
   - Configuration files protected

IMPORTANT NOTES:
- SSH is now running on port 2222
- Root login is disabled - use 'sysadmin' account
- Review firewall rules before production deployment
- Configure email notifications in fail2ban and monitoring scripts
- Test all configurations before deploying to production

Log file: $LOG_FILE
Backup location: $BACKUP_DIR

================================================================================

EOF
}

# Run main function
main "$@"
```

### Network Infrastructure Automation
```python
# Advanced network automation and monitoring
import subprocess
import json
import yaml
import requests
import paramiko
import netmiko
from netmiko import ConnectHandler
from napalm import get_network_driver
import concurrent.futures
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import sqlite3
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class NetworkDevice:
    hostname: str
    ip_address: str
    device_type: str
    username: str
    password: str
    enable_password: Optional[str] = None
    port: int = 22
    timeout: int = 30

@dataclass
class DeviceStatus:
    hostname: str
    ip_address: str
    status: str
    uptime: str
    cpu_usage: float
    memory_usage: float
    interface_count: int
    last_checked: datetime

class NetworkAutomation:
    """Advanced network device automation and monitoring"""

    def __init__(self, db_path: str = "/var/lib/network_automation.db"):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        self.setup_database()

    def setup_database(self):
        """Initialize SQLite database for storing device information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create devices table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hostname TEXT UNIQUE NOT NULL,
                ip_address TEXT NOT NULL,
                device_type TEXT NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                enable_password TEXT,
                port INTEGER DEFAULT 22,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create monitoring table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS device_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hostname TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                status TEXT NOT NULL,
                uptime TEXT,
                cpu_usage REAL,
                memory_usage REAL,
                interface_count INTEGER,
                checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (hostname) REFERENCES devices (hostname)
            )
        ''')

        # Create configuration backup table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS config_backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hostname TEXT NOT NULL,
                config_text TEXT NOT NULL,
                backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (hostname) REFERENCES devices (hostname)
            )
        ''')

        conn.commit()
        conn.close()

    def add_device(self, device: NetworkDevice):
        """Add a network device to the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute('''
                INSERT OR REPLACE INTO devices
                (hostname, ip_address, device_type, username, password, enable_password, port, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                device.hostname, device.ip_address, device.device_type,
                device.username, device.password, device.enable_password, device.port
            ))

            conn.commit()
            self.logger.info(f"Added device {device.hostname} to database")

        except sqlite3.Error as e:
            self.logger.error(f"Database error adding device {device.hostname}: {e}")
        finally:
            conn.close()

    def get_devices(self) -> List[NetworkDevice]:
        """Retrieve all devices from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute('SELECT * FROM devices')
            rows = cursor.fetchall()

            devices = []
            for row in rows:
                device = NetworkDevice(
                    hostname=row[1],
                    ip_address=row[2],
                    device_type=row[3],
                    username=row[4],
                    password=row[5],
                    enable_password=row[6],
                    port=row[7] or 22
                )
                devices.append(device)

            return devices

        except sqlite3.Error as e:
            self.logger.error(f"Database error retrieving devices: {e}")
            return []
        finally:
            conn.close()

    def connect_to_device(self, device: NetworkDevice):
        """Establish connection to network device using netmiko"""
        device_params = {
            'device_type': device.device_type,
            'host': device.ip_address,
            'username': device.username,
            'password': device.password,
            'port': device.port,
            'timeout': device.timeout,
        }

        if device.enable_password:
            device_params['secret'] = device.enable_password

        try:
            connection = ConnectHandler(**device_params)
            self.logger.info(f"Connected to {device.hostname}")
            return connection
        except Exception as e:
            self.logger.error(f"Failed to connect to {device.hostname}: {e}")
            return None

    def backup_device_config(self, device: NetworkDevice) -> bool:
        """Backup device configuration"""
        connection = self.connect_to_device(device)
        if not connection:
            return False

        try:
            # Get configuration based on device type
            if 'cisco' in device.device_type.lower():
                config = connection.send_command('show running-config')
            elif 'juniper' in device.device_type.lower():
                config = connection.send_command('show configuration')
            elif 'arista' in device.device_type.lower():
                config = connection.send_command('show running-config')
            else:
                config = connection.send_command('show config')

            # Store configuration in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO config_backups (hostname, config_text)
                VALUES (?, ?)
            ''', (device.hostname, config))

            conn.commit()
            conn.close()

            self.logger.info(f"Configuration backed up for {device.hostname}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to backup config for {device.hostname}: {e}")
            return False
        finally:
            connection.disconnect()

    def get_device_status(self, device: NetworkDevice) -> Optional[DeviceStatus]:
        """Get comprehensive device status information"""
        connection = self.connect_to_device(device)
        if not connection:
            return None

        try:
            status = DeviceStatus(
                hostname=device.hostname,
                ip_address=device.ip_address,
                status="Up",
                uptime="",
                cpu_usage=0.0,
                memory_usage=0.0,
                interface_count=0,
                last_checked=datetime.now()
            )

            # Get uptime
            if 'cisco' in device.device_type.lower():
                uptime_output = connection.send_command('show version | include uptime')
                if uptime_output:
                    status.uptime = uptime_output.strip()

                # Get CPU usage
                cpu_output = connection.send_command('show processes cpu | include CPU')
                if 'CPU utilization' in cpu_output:
                    import re
                    cpu_match = re.search(r'(\d+)%', cpu_output)
                    if cpu_match:
                        status.cpu_usage = float(cpu_match.group(1))

                # Get memory usage
                memory_output = connection.send_command('show memory | include Processor')
                # Parse memory output and calculate usage percentage

                # Get interface count
                interface_output = connection.send_command('show ip interface brief')
                status.interface_count = len(interface_output.split('\n')) - 3  # Subtract header lines

            elif 'juniper' in device.device_type.lower():
                uptime_output = connection.send_command('show system uptime')
                status.uptime = uptime_output.strip()

                # Get system information for Juniper
                system_info = connection.send_command('show chassis routing-engine')
                # Parse system info for CPU and memory

            # Store status in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO device_status
                (hostname, ip_address, status, uptime, cpu_usage, memory_usage, interface_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                status.hostname, status.ip_address, status.status,
                status.uptime, status.cpu_usage, status.memory_usage, status.interface_count
            ))

            conn.commit()
            conn.close()

            return status

        except Exception as e:
            self.logger.error(f"Failed to get status for {device.hostname}: {e}")
            # Return offline status
            return DeviceStatus(
                hostname=device.hostname,
                ip_address=device.ip_address,
                status="Down",
                uptime="",
                cpu_usage=0.0,
                memory_usage=0.0,
                interface_count=0,
                last_checked=datetime.now()
            )
        finally:
            connection.disconnect()

    def deploy_configuration(self, device: NetworkDevice, config_commands: List[str]) -> bool:
        """Deploy configuration commands to device"""
        connection = self.connect_to_device(device)
        if not connection:
            return False

        try:
            # Backup current configuration first
            self.backup_device_config(device)

            # Enter configuration mode
            if 'cisco' in device.device_type.lower():
                connection.enable()
                output = connection.send_config_set(config_commands)
                connection.save_config()
            elif 'juniper' in device.device_type.lower():
                connection.send_command('configure')
                for command in config_commands:
                    connection.send_command(command)
                connection.send_command('commit and-quit')

            self.logger.info(f"Configuration deployed to {device.hostname}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to deploy configuration to {device.hostname}: {e}")
            return False
        finally:
            connection.disconnect()

    def monitor_all_devices(self) -> List[DeviceStatus]:
        """Monitor all devices in parallel"""
        devices = self.get_devices()
        statuses = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_device = {
                executor.submit(self.get_device_status, device): device
                for device in devices
            }

            for future in concurrent.futures.as_completed(future_to_device):
                device = future_to_device[future]
                try:
                    status = future.result()
                    if status:
                        statuses.append(status)
                except Exception as e:
                    self.logger.error(f"Monitor task failed for {device.hostname}: {e}")

        return statuses

    def generate_network_report(self) -> Dict[str, Any]:
        """Generate comprehensive network status report"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Get latest status for each device
            cursor.execute('''
                SELECT DISTINCT hostname, ip_address, status, uptime, cpu_usage, memory_usage,
                       interface_count, checked_at
                FROM device_status ds1
                WHERE checked_at = (
                    SELECT MAX(checked_at)
                    FROM device_status ds2
                    WHERE ds1.hostname = ds2.hostname
                )
            ''')

            latest_statuses = cursor.fetchall()

            # Calculate summary statistics
            total_devices = len(latest_statuses)
            online_devices = sum(1 for status in latest_statuses if status[2] == 'Up')
            offline_devices = total_devices - online_devices

            avg_cpu = sum(status[4] for status in latest_statuses if status[4]) / total_devices if total_devices > 0 else 0
            avg_memory = sum(status[5] for status in latest_statuses if status[5]) / total_devices if total_devices > 0 else 0

            # Get devices with high resource usage
            high_cpu_devices = [status for status in latest_statuses if status[4] and status[4] > 80]
            high_memory_devices = [status for status in latest_statuses if status[5] and status[5] > 90]

            report = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_devices': total_devices,
                    'online_devices': online_devices,
                    'offline_devices': offline_devices,
                    'availability_percentage': (online_devices / total_devices * 100) if total_devices > 0 else 0,
                    'average_cpu_usage': avg_cpu,
                    'average_memory_usage': avg_memory
                },
                'alerts': {
                    'high_cpu_devices': [{'hostname': s[0], 'cpu_usage': s[4]} for s in high_cpu_devices],
                    'high_memory_devices': [{'hostname': s[0], 'memory_usage': s[5]} for s in high_memory_devices],
                    'offline_devices': [{'hostname': s[0], 'ip_address': s[1]} for s in latest_statuses if s[2] == 'Down']
                },
                'device_details': [
                    {
                        'hostname': status[0],
                        'ip_address': status[1],
                        'status': status[2],
                        'uptime': status[3],
                        'cpu_usage': status[4],
                        'memory_usage': status[5],
                        'interface_count': status[6],
                        'last_checked': status[7]
                    }
                    for status in latest_statuses
                ]
            }

            return report

        except sqlite3.Error as e:
            self.logger.error(f"Database error generating report: {e}")
            return {}
        finally:
            conn.close()

    def cleanup_old_data(self, days_to_keep: int = 30):
        """Clean up old monitoring data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)

            # Clean up old status records
            cursor.execute('''
                DELETE FROM device_status
                WHERE checked_at < ?
            ''', (cutoff_date,))

            # Keep only latest 10 config backups per device
            cursor.execute('''
                DELETE FROM config_backups
                WHERE id NOT IN (
                    SELECT id FROM config_backups cb1
                    WHERE (
                        SELECT COUNT(*)
                        FROM config_backups cb2
                        WHERE cb2.hostname = cb1.hostname
                        AND cb2.backup_date >= cb1.backup_date
                    ) <= 10
                )
            ''')

            conn.commit()
            self.logger.info(f"Cleaned up data older than {days_to_keep} days")

        except sqlite3.Error as e:
            self.logger.error(f"Database error during cleanup: {e}")
        finally:
            conn.close()

# Network monitoring script
def main():
    """Main network monitoring function"""

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/var/log/network_automation.log'),
            logging.StreamHandler()
        ]
    )

    # Initialize network automation
    net_auto = NetworkAutomation()

    # Example device configuration
    devices = [
        NetworkDevice(
            hostname="router-01",
            ip_address="192.168.1.1",
            device_type="cisco_ios",
            username="admin",
            password="password"
        ),
        NetworkDevice(
            hostname="switch-01",
            ip_address="192.168.1.2",
            device_type="cisco_ios",
            username="admin",
            password="password"
        )
    ]

    # Add devices to monitoring
    for device in devices:
        net_auto.add_device(device)

    # Monitor all devices
    statuses = net_auto.monitor_all_devices()

    # Generate report
    report = net_auto.generate_network_report()

    # Save report to file
    with open('/var/log/network_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    # Check for alerts
    if report.get('alerts'):
        if report['alerts']['offline_devices']:
            print(f"ALERT: {len(report['alerts']['offline_devices'])} devices are offline")

        if report['alerts']['high_cpu_devices']:
            print(f"WARNING: {len(report['alerts']['high_cpu_devices'])} devices have high CPU usage")

        if report['alerts']['high_memory_devices']:
            print(f"WARNING: {len(report['alerts']['high_memory_devices'])} devices have high memory usage")

    # Clean up old data
    net_auto.cleanup_old_data(days_to_keep=30)

    print(f"Network monitoring completed. Report saved to /var/log/network_report.json")

if __name__ == "__main__":
    main()
```

## Skill Activation Triggers

This skill automatically activates when:
- Linux system administration is needed
- Server configuration and hardening is required
- Network infrastructure management is requested
- Security compliance implementation is needed
- System monitoring and alerting setup is required
- Backup and disaster recovery planning is requested

This comprehensive system administration skill provides expert-level capabilities for managing modern Linux infrastructure with security best practices and automation.
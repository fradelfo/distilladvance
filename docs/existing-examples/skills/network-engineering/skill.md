# Network Engineering & DevNet Skill

Advanced network infrastructure design and automation expertise covering modern networking, SD-WAN, network automation, and DevNet practices for scalable enterprise networks.

## Skill Overview

Expert network knowledge including routing protocols, switching technologies, network security, automation frameworks, infrastructure as code for networks, and modern DevNet practices for programmable infrastructure.

## Core Capabilities

### Modern Network Infrastructure
- **Routing protocols** - BGP, OSPF, EIGRP, ISIS configuration and optimization
- **Switching technologies** - VLANs, STP variants, LACP, advanced L2/L3 switching
- **Network virtualization** - VXLAN, EVPN, overlay networks, micro-segmentation
- **SD-WAN deployment** - Cisco, VMware, Silver Peak, centralized policy management

### Network Automation & DevNet
- **Infrastructure as Code** - Ansible, Terraform, Nornir for network automation
- **API integration** - REST APIs, NETCONF, RESTCONF, gRPC for device management
- **Configuration management** - Git-based workflows, network CI/CD pipelines
- **Monitoring automation** - SNMP, streaming telemetry, real-time analytics

### Security & Compliance
- **Network security** - Firewalls, IPS/IDS, VPN technologies, zero-trust networking
- **Compliance frameworks** - PCI DSS, SOX, HIPAA network requirements
- **Security automation** - Policy as code, automated threat response
- **Network forensics** - Traffic analysis, incident investigation, breach detection

### Cloud & Hybrid Networking
- **Multi-cloud connectivity** - AWS VPC, Azure VNet, GCP VPC interconnection
- **Hybrid cloud** - Direct Connect, ExpressRoute, dedicated interconnects
- **Container networking** - Kubernetes CNI, service mesh, network policies
- **Edge computing** - 5G networks, IoT connectivity, edge orchestration

## Modern Network Engineering Implementation

### Advanced BGP Configuration and Automation
```python
# Comprehensive BGP automation with Nornir and Jinja2
from nornir import InitNornir
from nornir_netmiko import netmiko_send_config
from nornir_jinja2 import template_file
from nornir.core.filter import F
import json
import yaml
from typing import Dict, List, Any, Optional
import ipaddress
from dataclasses import dataclass
import logging
from datetime import datetime
import asyncio
from nornir_utils.plugins.functions import print_result

@dataclass
class BGPPeer:
    remote_as: int
    neighbor_ip: str
    description: str
    password: Optional[str] = None
    maximum_paths: int = 1
    route_maps: Optional[Dict[str, str]] = None
    bfd_enable: bool = False

@dataclass
class BGPConfig:
    local_as: int
    router_id: str
    networks: List[str]
    peers: List[BGPPeer]
    address_families: List[str]
    confederation_id: Optional[int] = None
    route_reflector: bool = False

class BGPAutomation:
    """Advanced BGP configuration and monitoring automation"""

    def __init__(self, inventory_file: str = "inventory.yaml"):
        self.nr = InitNornir(
            inventory={
                "plugin": "SimpleInventory",
                "options": {
                    "host_file": "hosts.yaml",
                    "group_file": "groups.yaml"
                }
            },
            runner={
                "plugin": "threaded",
                "options": {
                    "num_workers": 20
                }
            }
        )
        self.logger = logging.getLogger(__name__)

    def deploy_bgp_configuration(self, devices: List[str], bgp_config: Dict[str, BGPConfig]):
        """Deploy BGP configuration to multiple devices"""

        def configure_bgp(task):
            device_config = bgp_config.get(task.host.name)
            if not device_config:
                return f"No BGP configuration found for {task.host.name}"

            # Generate BGP configuration from template
            result = task.run(
                task=template_file,
                template="bgp_config.j2",
                path="templates/",
                bgp=device_config,
                severity_level=logging.INFO
            )

            # Apply configuration
            config_lines = result.result.split('\n')
            task.run(
                task=netmiko_send_config,
                config_commands=config_lines,
                name="Apply BGP Configuration"
            )

            return f"BGP configuration applied to {task.host.name}"

        # Filter devices and run configuration
        target_hosts = self.nr.filter(F(name__any=devices))
        result = target_hosts.run(task=configure_bgp)
        print_result(result)

    def validate_bgp_neighbors(self, devices: List[str]) -> Dict[str, Dict]:
        """Validate BGP neighbor states across devices"""

        def check_bgp_status(task):
            # Get BGP neighbor summary
            result = task.run(
                task=netmiko_send_command,
                command_string="show bgp summary",
                name="BGP Summary"
            )

            bgp_output = result.result
            neighbors = self.parse_bgp_summary(bgp_output)

            # Get detailed neighbor information
            neighbor_details = {}
            for neighbor_ip in neighbors:
                detail_result = task.run(
                    task=netmiko_send_command,
                    command_string=f"show bgp neighbors {neighbor_ip}",
                    name=f"BGP Neighbor {neighbor_ip} Detail"
                )
                neighbor_details[neighbor_ip] = self.parse_bgp_neighbor_detail(detail_result.result)

            return {
                'summary': neighbors,
                'details': neighbor_details,
                'status': 'healthy' if all(n.get('state') == 'Established' for n in neighbors.values()) else 'issues'
            }

        target_hosts = self.nr.filter(F(name__any=devices))
        results = target_hosts.run(task=check_bgp_status)

        validation_report = {}
        for host, result in results.items():
            validation_report[host] = result.result

        return validation_report

    def generate_bgp_health_report(self) -> Dict[str, Any]:
        """Generate comprehensive BGP network health report"""

        all_devices = list(self.nr.inventory.hosts.keys())
        bgp_status = self.validate_bgp_neighbors(all_devices)

        report = {
            'timestamp': datetime.now().isoformat(),
            'total_devices': len(all_devices),
            'healthy_devices': 0,
            'devices_with_issues': 0,
            'total_neighbors': 0,
            'established_neighbors': 0,
            'down_neighbors': [],
            'route_table_summary': {},
            'recommendations': []
        }

        for device, status in bgp_status.items():
            if status['status'] == 'healthy':
                report['healthy_devices'] += 1
            else:
                report['devices_with_issues'] += 1

            for neighbor_ip, neighbor_info in status['summary'].items():
                report['total_neighbors'] += 1
                if neighbor_info.get('state') == 'Established':
                    report['established_neighbors'] += 1
                else:
                    report['down_neighbors'].append({
                        'device': device,
                        'neighbor': neighbor_ip,
                        'state': neighbor_info.get('state'),
                        'last_change': neighbor_info.get('up_down')
                    })

        # Generate recommendations
        if report['down_neighbors']:
            report['recommendations'].append("Investigate down BGP neighbors")

        if report['devices_with_issues'] > 0:
            report['recommendations'].append("Review devices with BGP issues")

        return report

    def parse_bgp_summary(self, output: str) -> Dict[str, Dict]:
        """Parse BGP summary output"""
        neighbors = {}
        lines = output.split('\n')

        for line in lines:
            if self.is_neighbor_line(line):
                parts = line.split()
                neighbor_ip = parts[0]
                neighbors[neighbor_ip] = {
                    'version': parts[1],
                    'as': parts[2],
                    'msg_rcvd': parts[3],
                    'msg_sent': parts[4],
                    'tbl_ver': parts[5],
                    'in_queue': parts[6],
                    'out_queue': parts[7],
                    'up_down': parts[8],
                    'state': parts[9] if len(parts) > 9 else 'Established'
                }

        return neighbors

    def parse_bgp_neighbor_detail(self, output: str) -> Dict[str, Any]:
        """Parse detailed BGP neighbor output"""
        details = {}

        # Extract key information using regex patterns
        import re

        # BGP state
        state_match = re.search(r'BGP state = (\w+)', output)
        if state_match:
            details['bgp_state'] = state_match.group(1)

        # Session state
        session_match = re.search(r'Session state = (\w+)', output)
        if session_match:
            details['session_state'] = session_match.group(1)

        # Prefixes received
        prefixes_match = re.search(r'(\d+) accepted prefixes', output)
        if prefixes_match:
            details['accepted_prefixes'] = int(prefixes_match.group(1))

        return details

    def is_neighbor_line(self, line: str) -> bool:
        """Check if line contains neighbor information"""
        import re
        # Look for IP address pattern at start of line
        ip_pattern = r'^\d+\.\d+\.\d+\.\d+'
        return bool(re.match(ip_pattern, line.strip()))

# Network Device Configuration Templates
class NetworkTemplates:
    """Jinja2 templates for network device configuration"""

    @staticmethod
    def get_bgp_template() -> str:
        return '''
router bgp {{ bgp.local_as }}
 bgp router-id {{ bgp.router_id }}
 bgp log-neighbor-changes
 {% if bgp.confederation_id %}
 bgp confederation identifier {{ bgp.confederation_id }}
 {% endif %}
 {% if bgp.route_reflector %}
 bgp cluster-id {{ bgp.router_id }}
 {% endif %}

 {% for network in bgp.networks %}
 network {{ network }}
 {% endfor %}

 {% for peer in bgp.peers %}
 neighbor {{ peer.neighbor_ip }} remote-as {{ peer.remote_as }}
 neighbor {{ peer.neighbor_ip }} description {{ peer.description }}
 {% if peer.password %}
 neighbor {{ peer.neighbor_ip }} password {{ peer.password }}
 {% endif %}
 {% if peer.bfd_enable %}
 neighbor {{ peer.neighbor_ip }} fall-over bfd
 {% endif %}
 neighbor {{ peer.neighbor_ip }} maximum-paths {{ peer.maximum_paths }}
 {% if peer.route_maps %}
 {% for direction, route_map in peer.route_maps.items() %}
 neighbor {{ peer.neighbor_ip }} route-map {{ route_map }} {{ direction }}
 {% endfor %}
 {% endif %}
 {% endfor %}

 {% for af in bgp.address_families %}
 address-family {{ af }}
 {% for peer in bgp.peers %}
 neighbor {{ peer.neighbor_ip }} activate
 {% endfor %}
 exit-address-family
 {% endfor %}
!
'''

    @staticmethod
    def get_vlan_template() -> str:
        return '''
{% for vlan in vlans %}
vlan {{ vlan.vlan_id }}
 name {{ vlan.name }}
 {% if vlan.description %}
 description {{ vlan.description }}
 {% endif %}
!
{% endfor %}

{% for interface in interfaces %}
interface {{ interface.name }}
 description {{ interface.description }}
 {% if interface.mode == 'access' %}
 switchport mode access
 switchport access vlan {{ interface.access_vlan }}
 {% elif interface.mode == 'trunk' %}
 switchport mode trunk
 {% if interface.trunk_vlans %}
 switchport trunk allowed vlan {{ interface.trunk_vlans | join(',') }}
 {% endif %}
 {% if interface.native_vlan %}
 switchport trunk native vlan {{ interface.native_vlan }}
 {% endif %}
 {% endif %}
 {% if interface.port_security %}
 switchport port-security
 switchport port-security maximum {{ interface.port_security.max_addresses }}
 switchport port-security violation {{ interface.port_security.violation_action }}
 {% endif %}
 no shutdown
!
{% endfor %}
'''

# SD-WAN Configuration and Management
class SDWANAutomation:
    """SD-WAN deployment and management automation"""

    def __init__(self, controller_type: str = "cisco"):
        self.controller_type = controller_type
        self.logger = logging.getLogger(__name__)

    def deploy_site_configuration(self, site_config: Dict[str, Any]) -> Dict[str, str]:
        """Deploy SD-WAN site configuration"""

        template_map = {
            'cisco': self.generate_cisco_sdwan_config,
            'vmware': self.generate_vmware_sdwan_config,
            'silver_peak': self.generate_silver_peak_config
        }

        generator = template_map.get(self.controller_type)
        if not generator:
            raise ValueError(f"Unsupported SD-WAN controller: {self.controller_type}")

        return generator(site_config)

    def generate_cisco_sdwan_config(self, site_config: Dict[str, Any]) -> Dict[str, str]:
        """Generate Cisco SD-WAN (Viptela) configuration"""

        device_template = {
            'system': {
                'host-name': site_config['hostname'],
                'system-ip': site_config['system_ip'],
                'site-id': site_config['site_id'],
                'organization-name': site_config['organization'],
                'vbond': site_config['vbond_ip']
            },
            'vpn': [
                {
                    'vpn-id': 0,
                    'interface': {
                        'type': 'ge',
                        'interface-name': site_config['wan_interface'],
                        'ip': {
                            'address': site_config['wan_ip']
                        },
                        'tunnel-interface': {
                            'encapsulation': ['ipsec'],
                            'color': site_config.get('color', 'biz-internet'),
                            'allow-service': ['all']
                        }
                    }
                },
                {
                    'vpn-id': 1,
                    'interface': {
                        'type': 'ge',
                        'interface-name': site_config['lan_interface'],
                        'ip': {
                            'address': site_config['lan_ip']
                        }
                    },
                    'ip': {
                        'route': {
                            'prefix': '0.0.0.0/0',
                            'next-hop': {
                                'address': site_config['lan_gateway']
                            }
                        }
                    }
                }
            ],
            'policy': {
                'data-policy': site_config.get('data_policy', 'default'),
                'app-route-policy': site_config.get('app_policy', 'default')
            }
        }

        return {
            'device_template': json.dumps(device_template, indent=2),
            'feature_templates': self.generate_feature_templates(site_config)
        }

    def generate_feature_templates(self, site_config: Dict[str, Any]) -> str:
        """Generate Cisco SD-WAN feature templates"""

        features = {
            'system_template': {
                'templateName': f"{site_config['hostname']}_system",
                'templateDescription': f"System template for {site_config['hostname']}",
                'templateType': 'cisco_system',
                'templateDefinition': {
                    'system': {
                        'host-name': {'vipType': 'constant', 'vipValue': site_config['hostname']},
                        'system-ip': {'vipType': 'constant', 'vipValue': site_config['system_ip']},
                        'site-id': {'vipType': 'constant', 'vipValue': site_config['site_id']},
                        'console-baud-rate': {'vipType': 'constant', 'vipValue': '9600'},
                        'max-omp-sessions': {'vipType': 'constant', 'vipValue': '2'}
                    }
                }
            },
            'interface_template': {
                'templateName': f"{site_config['hostname']}_interface",
                'templateDescription': f"Interface template for {site_config['hostname']}",
                'templateType': 'cisco_vpn_interface',
                'templateDefinition': {
                    'vpn-interface': {
                        'if-name': {'vipType': 'constant', 'vipValue': site_config['wan_interface']},
                        'ip': {
                            'address': {'vipType': 'constant', 'vipValue': site_config['wan_ip']}
                        },
                        'tunnel-interface': {
                            'encapsulation': {'vipType': 'constant', 'vipValue': [{'preference': 0, 'type': 'ipsec'}]},
                            'color': {'vipType': 'constant', 'vipValue': site_config.get('color', 'biz-internet')},
                            'groups': {'vipType': 'constant', 'vipValue': [1]},
                            'border': {'vipType': 'constant', 'vipValue': 'false'},
                            'max-control-connections': {'vipType': 'constant', 'vipValue': '4'}
                        }
                    }
                }
            }
        }

        return json.dumps(features, indent=2)

# Network Monitoring and Telemetry
class NetworkTelemetry:
    """Advanced network monitoring using streaming telemetry"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.collectors = []

    def setup_streaming_telemetry(self, devices: List[str]) -> Dict[str, Any]:
        """Configure streaming telemetry on network devices"""

        telemetry_config = {
            'global_settings': {
                'enable': True,
                'max-sensor-paths': 1000,
                'max-containers': 16
            },
            'sensor_groups': [
                {
                    'name': 'interface_stats',
                    'paths': [
                        'Cisco-IOS-XR-infra-statsd-oper:infra-statistics/interfaces/interface/latest/generic-counters',
                        'Cisco-IOS-XR-pfi-im-cmd-oper:interfaces/interface-xr/interface'
                    ],
                    'sample_interval': 30000  # 30 seconds
                },
                {
                    'name': 'bgp_stats',
                    'paths': [
                        'Cisco-IOS-XR-ipv4-bgp-oper:bgp/instances/instance/instance-active/default-vrf/neighbors/neighbor',
                        'Cisco-IOS-XR-ipv4-bgp-oper:bgp/instances/instance/instance-active/default-vrf/process-info'
                    ],
                    'sample_interval': 60000  # 60 seconds
                },
                {
                    'name': 'cpu_memory',
                    'paths': [
                        'Cisco-IOS-XR-wdsysmon-fd-oper:system-monitoring/cpu-utilization',
                        'Cisco-IOS-XR-nto-misc-oper:memory-summary/nodes/node/summary'
                    ],
                    'sample_interval': 30000
                }
            ],
            'subscriptions': [
                {
                    'name': 'interface_subscription',
                    'sensor_groups': ['interface_stats'],
                    'destination_groups': ['prometheus_collector'],
                    'protocol': 'grpc',
                    'encoding': 'json'
                },
                {
                    'name': 'bgp_subscription',
                    'sensor_groups': ['bgp_stats'],
                    'destination_groups': ['prometheus_collector'],
                    'protocol': 'grpc',
                    'encoding': 'json'
                }
            ],
            'destination_groups': [
                {
                    'name': 'prometheus_collector',
                    'destinations': [
                        {
                            'address': '10.1.1.100',
                            'port': 57500,
                            'protocol': 'grpc'
                        }
                    ]
                }
            ]
        }

        return telemetry_config

    async def collect_telemetry_data(self, device_ip: str, port: int = 57500) -> Dict[str, Any]:
        """Collect streaming telemetry data from devices"""

        import grpc
        from concurrent.futures import ThreadPoolExecutor

        try:
            # gRPC client setup for telemetry collection
            channel = grpc.insecure_channel(f'{device_ip}:{port}')

            # This would be implemented with the actual gRPC proto definitions
            # for the specific vendor's telemetry interface
            collected_data = {
                'timestamp': datetime.now().isoformat(),
                'device': device_ip,
                'interfaces': await self.collect_interface_metrics(channel),
                'bgp': await self.collect_bgp_metrics(channel),
                'system': await self.collect_system_metrics(channel)
            }

            channel.close()
            return collected_data

        except Exception as e:
            self.logger.error(f"Failed to collect telemetry from {device_ip}: {str(e)}")
            return {'error': str(e), 'device': device_ip}

    async def collect_interface_metrics(self, channel) -> List[Dict]:
        """Collect interface statistics"""
        # Implementation would use actual gRPC calls
        return [
            {
                'interface': 'GigabitEthernet0/0/0',
                'in_octets': 1234567890,
                'out_octets': 9876543210,
                'in_packets': 12345678,
                'out_packets': 87654321,
                'in_errors': 0,
                'out_errors': 0,
                'utilization': 45.2
            }
        ]

# Network Security Automation
class NetworkSecurityAutomation:
    """Network security policy automation and compliance"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.policy_templates = {}

    def deploy_security_policies(self, firewall_type: str, policies: List[Dict]) -> Dict[str, Any]:
        """Deploy security policies to firewalls"""

        policy_generators = {
            'palo_alto': self.generate_palo_alto_policies,
            'fortinet': self.generate_fortinet_policies,
            'cisco_asa': self.generate_cisco_asa_policies,
            'checkpoint': self.generate_checkpoint_policies
        }

        generator = policy_generators.get(firewall_type)
        if not generator:
            raise ValueError(f"Unsupported firewall type: {firewall_type}")

        return generator(policies)

    def generate_palo_alto_policies(self, policies: List[Dict]) -> Dict[str, Any]:
        """Generate Palo Alto Networks firewall policies"""

        policy_config = {
            'security_rules': [],
            'address_objects': [],
            'service_objects': [],
            'application_groups': []
        }

        for policy in policies:
            security_rule = {
                'name': policy['name'],
                'from': policy['source_zones'],
                'to': policy['destination_zones'],
                'source': policy['source_addresses'],
                'destination': policy['destination_addresses'],
                'application': policy.get('applications', ['any']),
                'service': policy.get('services', ['any']),
                'action': policy.get('action', 'allow'),
                'profile-setting': {
                    'profiles': {
                        'virus': 'default',
                        'spyware': 'strict',
                        'vulnerability': 'strict',
                        'url-filtering': 'default',
                        'file-blocking': 'strict basic file blocking',
                        'wildfire-analysis': 'default'
                    }
                },
                'log-setting': 'default',
                'description': policy.get('description', '')
            }

            policy_config['security_rules'].append(security_rule)

        # Generate XML configuration
        xml_config = self.generate_palo_alto_xml(policy_config)

        return {
            'config': policy_config,
            'xml': xml_config,
            'api_commands': self.generate_palo_alto_api_commands(policy_config)
        }

    def generate_palo_alto_xml(self, config: Dict) -> str:
        """Generate Palo Alto XML configuration"""

        xml_template = '''<?xml version="1.0" encoding="UTF-8"?>
<config version="9.1.0">
  <devices>
    <entry name="localhost.localdomain">
      <vsys>
        <entry name="vsys1">
          <rulebase>
            <security>
              <rules>
                {% for rule in security_rules %}
                <entry name="{{ rule.name }}">
                  <from>
                    {% for zone in rule.from %}
                    <member>{{ zone }}</member>
                    {% endfor %}
                  </from>
                  <to>
                    {% for zone in rule.to %}
                    <member>{{ zone }}</member>
                    {% endfor %}
                  </to>
                  <source>
                    {% for addr in rule.source %}
                    <member>{{ addr }}</member>
                    {% endfor %}
                  </source>
                  <destination>
                    {% for addr in rule.destination %}
                    <member>{{ addr }}</member>
                    {% endfor %}
                  </destination>
                  <application>
                    {% for app in rule.application %}
                    <member>{{ app }}</member>
                    {% endfor %}
                  </application>
                  <service>
                    {% for svc in rule.service %}
                    <member>{{ svc }}</member>
                    {% endfor %}
                  </service>
                  <action>{{ rule.action }}</action>
                  <profile-setting>
                    <profiles>
                      {% for profile_type, profile_name in rule['profile-setting']['profiles'].items() %}
                      <{{ profile_type }}>
                        <member>{{ profile_name }}</member>
                      </{{ profile_type }}>
                      {% endfor %}
                    </profiles>
                  </profile-setting>
                  <log-setting>{{ rule['log-setting'] }}</log-setting>
                  <description>{{ rule.description }}</description>
                </entry>
                {% endfor %}
              </rules>
            </security>
          </rulebase>
        </entry>
      </vsys>
    </entry>
  </devices>
</config>'''

        from jinja2 import Template
        template = Template(xml_template)
        return template.render(**config)

# Example usage and testing
def main():
    """Demonstrate network engineering automation"""

    # BGP Configuration Example
    bgp_automation = BGPAutomation()

    # Define BGP configuration for multiple devices
    bgp_configs = {
        'router1': BGPConfig(
            local_as=65001,
            router_id='1.1.1.1',
            networks=['10.1.0.0/16', '192.168.1.0/24'],
            peers=[
                BGPPeer(
                    remote_as=65002,
                    neighbor_ip='10.0.0.2',
                    description='Router2 eBGP',
                    bfd_enable=True,
                    route_maps={'in': 'RM_IN', 'out': 'RM_OUT'}
                ),
                BGPPeer(
                    remote_as=65001,
                    neighbor_ip='10.0.0.3',
                    description='Router3 iBGP',
                    bfd_enable=True
                )
            ],
            address_families=['ipv4 unicast', 'vpnv4 unicast']
        )
    }

    print("=== BGP Configuration Deployment ===")
    # bgp_automation.deploy_bgp_configuration(['router1'], bgp_configs)

    # Validation and Monitoring
    print("\n=== BGP Health Monitoring ===")
    # health_report = bgp_automation.generate_bgp_health_report()
    # print(json.dumps(health_report, indent=2))

    # SD-WAN Configuration Example
    print("\n=== SD-WAN Configuration ===")
    sdwan = SDWANAutomation('cisco')

    site_config = {
        'hostname': 'Branch-Site-01',
        'system_ip': '10.255.1.1',
        'site_id': 100,
        'organization': 'ACME-Corp',
        'vbond_ip': '10.0.0.10',
        'wan_interface': 'ge0/0',
        'wan_ip': '203.0.113.10/30',
        'lan_interface': 'ge0/1',
        'lan_ip': '192.168.100.1/24',
        'lan_gateway': '192.168.100.254',
        'color': 'biz-internet',
        'data_policy': 'BRANCH_DATA_POLICY',
        'app_policy': 'BRANCH_APP_POLICY'
    }

    sdwan_config = sdwan.deploy_site_configuration(site_config)
    print("SD-WAN Configuration Generated:")
    print(sdwan_config['device_template'][:500] + "...")

    # Network Security Automation Example
    print("\n=== Security Policy Deployment ===")
    security = NetworkSecurityAutomation()

    security_policies = [
        {
            'name': 'Allow-Web-Traffic',
            'source_zones': ['trust'],
            'destination_zones': ['untrust'],
            'source_addresses': ['any'],
            'destination_addresses': ['any'],
            'applications': ['web-browsing', 'ssl'],
            'action': 'allow',
            'description': 'Allow outbound web traffic'
        },
        {
            'name': 'Block-P2P-Traffic',
            'source_zones': ['trust'],
            'destination_zones': ['untrust'],
            'source_addresses': ['any'],
            'destination_addresses': ['any'],
            'applications': ['bittorrent', 'edonkey'],
            'action': 'deny',
            'description': 'Block peer-to-peer applications'
        }
    ]

    palo_alto_config = security.deploy_security_policies('palo_alto', security_policies)
    print("Security Policies Generated:")
    print(json.dumps(palo_alto_config['config']['security_rules'][0], indent=2))

    # Network Telemetry Setup
    print("\n=== Network Telemetry Configuration ===")
    telemetry = NetworkTelemetry()

    telemetry_config = telemetry.setup_streaming_telemetry(['10.1.1.1', '10.1.1.2'])
    print("Telemetry Configuration:")
    print(json.dumps(telemetry_config['sensor_groups'][0], indent=2))

if __name__ == "__main__":
    main()
```

## Skill Activation Triggers

This skill automatically activates when:
- Network infrastructure design is needed
- Routing protocol configuration is required
- SD-WAN deployment is requested
- Network automation development is needed
- Network security policy implementation is required
- Network monitoring and telemetry setup is requested

This comprehensive network engineering and DevNet skill provides expert-level capabilities for modern network infrastructure automation using industry-standard tools and practices.
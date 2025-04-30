/**
 * Comandos específicos para OLT Huawei MA5800-X7
 * Implementação baseada na CLI real do equipamento
 */

class OLTCommands {
    constructor() {
        this.model = 'MA5800-X7';
        this.vendor = 'Huawei';
    }

    // Comandos de Sistema
    async enterConfigMode() {
        return [
            'enable',
            'config'
        ];
    }

    async getSystemInfo() {
        return [
            'display system-info',
            'display version',
            'display board'
        ];
    }

    async getAlarms() {
        return [
            'display alarm-info',
            'display alarm-history'
        ];
    }

    // Comandos de Gerenciamento de ONUs
    async discoverONUs(port) {
        return [
            'display ont autofind all',
            `display ont autofind ${port}`
        ];
    }

    async authorizeONU(port, sn, description, lineProfile = "1", srvProfile = "1") {
        return [
            `ont add ${port} sn-auth ${sn} omci ont-lineprofile-id ${lineProfile} ont-srvprofile-id ${srvProfile} desc "${description}"`
        ];
    }

    async getONUInfo(port, onuId) {
        return [
            `display ont info ${port} ${onuId}`,
            `display ont optical-info ${port} ${onuId}`,
            `display ont version ${port} ${onuId}`
        ];
    }

    async configureONUPorts(port, onuId, config) {
        const commands = [];
        if (config.nativeVlan) {
            commands.push(`ont port native-vlan ${port} ${onuId} eth 1 vlan ${config.nativeVlan}`);
        }
        return commands;
    }

    // Comandos de VLAN
    async configureVLAN(vlanId, description) {
        return [
            `vlan ${vlanId}`,
            `description ${description}`,
            'quit'
        ];
    }

    async configureServicePort(vlanId, port, mode = 'user-vlan') {
        return [
            `service-port vlan ${vlanId} ${port} ${mode}`
        ];
    }

    // Comandos de Perfis
    async configureDBAProfile(profileId, type, options) {
        return [
            `dba-profile add ${profileId} type ${type}`,
            ...Object.entries(options).map(([key, value]) => `dba-profile ${profileId} ${key} ${value}`)
        ];
    }

    async configureLineProfile(profileId) {
        return [
            `ont-lineprofile gpon profile-id ${profileId}`,
            'tcont 1 dba-profile-id 1',
            'gem add 1 eth tcont 1',
            'mapping-mode vlan',
            'quit'
        ];
    }

    // Comandos de Monitoramento
    async getPortStatistics(port) {
        return [
            `display port statistics ${port}`,
            `display port state ${port}`
        ];
    }

    async getTrafficInfo(port) {
        return [
            `display traffic-statistics ${port}`
        ];
    }

    // Comandos de Manutenção
    async backup(server, filename) {
        return [
            `backup configuration ${server} ${filename}`
        ];
    }

    async restore(server, filename) {
        return [
            `restore configuration ${server} ${filename}`
        ];
    }

    async reboot(component = 'system') {
        return [
            `reboot ${component}`
        ];
    }

    // Comandos de Segurança
    async configureSnmp(community, trapHost) {
        return [
            'snmp-agent',
            `snmp-agent community read ${community}`,
            `snmp-agent trap source-ip ${trapHost}`,
            'snmp-agent trap enable'
        ];
    }

    async configureSyslog(server, level = 'info') {
        return [
            'info-center enable',
            `info-center loghost ${server}`,
            `info-center priority ${level}`
        ];
    }

    // Utilitários
    formatCommand(command) {
        if (Array.isArray(command)) {
            return command.join('\n');
        }
        return command;
    }

    validatePort(port) {
        // Formato: slot/port ou slot/subcard/port
        const portRegex = /^(\d+\/\d+\/\d+|\d+\/\d+)$/;
        return portRegex.test(port);
    }

    validateVlan(vlan) {
        return vlan >= 1 && vlan <= 4094;
    }
}

module.exports = new OLTCommands(); 
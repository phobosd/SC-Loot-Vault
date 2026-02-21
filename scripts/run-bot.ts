// scripts/run-bot.ts
import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder,
  Message,
  ChatInputCommandInteraction
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const PREFIX = "!vault";

async function startBot() {
  const org = await prisma.org.findFirst({
    where: { discordBotToken: { not: null } }
  });
  
  if (!org || !org.discordBotToken) {
    console.error('CRITICAL: No Discord Bot Token found in database manifest.');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const commands = [
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Display available commands and bridge protocols.'),

    new SlashCommandBuilder()
      .setName('vault-status')
      .setDescription('Show a summary of the vault health and total items.'),
    
    new SlashCommandBuilder()
      .setName('loot-search')
      .setDescription('Search the current organization vault inventory.')
      .addStringOption(option => 
        option.setName('query')
          .setDescription('Item name or category to search for')
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName('link-account')
      .setDescription('Link your Discord account to your Operator Designation.')
      .addStringOption(option => 
        option.setName('designation')
          .setDescription('Your vault username (e.g. C.ROBERTS)')
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName('my-assets')
      .setDescription('View assets currently assigned to your personnel file.'),

    new SlashCommandBuilder()
      .setName('request-asset')
      .setDescription('Request an item from the organization vault.')
      .addStringOption(option => 
        option.setName('item')
          .setDescription('Name of the item to request')
          .setRequired(true))
      .addIntegerOption(option => 
        option.setName('quantity')
          .setDescription('Quantity required')
          .setRequired(false)),

    new SlashCommandBuilder()
      .setName('personnel')
      .setDescription('List all registered operators in the organization (Admin Only).'),
  ].map(command => command.toJSON());

  const registerCommands = async (clientId: string) => {
    const rest = new REST({ version: '10' }).setToken(org.discordBotToken!);
    try {
      console.log('SYNCING ADVANCED COMMANDS WITH DISCORD...');
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('COMMANDS SYNCHRONIZED SUCCESSFULLY.');
    } catch (error) {
      console.error('FAILED TO REGISTER COMMANDS:', error);
    }
  };

  // Heartbeat Mechanism
  const startHeartbeat = () => {
    setInterval(async () => {
      try {
        await prisma.org.update({
          where: { id: org.id },
          data: { discordBotLastSeen: new Date() }
        });
      } catch (err) {
        console.error("Heartbeat failure:", err);
      }
    }, 30000); // Every 30s
  };

  client.once('ready', async () => {
    console.log(`-----------------------------------------`);
    console.log(`NODE ONLINE // LINK ESTABLISHED: ${client.user?.tag}`);
    if (client.user) await registerCommands(client.user.id);
    startHeartbeat();
    console.log(`-----------------------------------------`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user: discordUser } = interaction;

    // Helper: Find DB User
    const dbUser = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
      include: { org: true }
    });

    if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor('#00D1FF')
        .setTitle('🛰️ MANIFEST BRIDGE: PROTOCOLS')
        .setDescription('Available uplink commands for the organization vault.')
        .addFields(
          { name: '`/link-account [designation]`', value: 'Tie your Discord node to your Vault operator file.' },
          { name: '`/my-assets`', value: 'View gear currently assigned to your person.' },
          { name: '`/request-asset [item]`', value: 'Request specific loot from the Org manifest.' },
          { name: '`/vault-status`', value: 'Real-time telemetry on vault health.' },
          { name: '`/loot-search [query]`', value: 'Search the master inventory for specific assets.' },
          { name: '`/personnel`', value: 'Display operator link status (Admin Only).' }
        )
        .setFooter({ text: 'DIXNCOX Logistics Node // 2954' });
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'link-account') {
      const designation = interaction.options.getString('designation')?.toUpperCase();
      try {
        const targetUser = await prisma.user.findUnique({ where: { username: designation } });
        if (!targetUser) return interaction.reply({ content: `❌ Error: Designation **${designation}** not found in database.`, ephemeral: true });
        
        await prisma.user.update({
          where: { id: targetUser.id },
          data: { discordId: discordUser.id }
        });

        return interaction.reply({ content: `✅ Link established. Discord node tied to Operator: **${targetUser.name || designation}**.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ Error: Link protocol failed. Perhaps this ID is already tied?`, ephemeral: true });
      }
    }

    if (commandName === 'vault-status') {
      const itemCount = await prisma.lootItem.count({ where: { orgId: org.id } });
      const userCount = await prisma.user.count({ where: { orgId: org.id } });
      const embed = new EmbedBuilder()
        .setColor('#00D1FF')
        .setTitle(`📡 VAULT TELEMETRY: ${org.name}`)
        .addFields(
          { name: 'System Status', value: '🟢 OPTIMAL', inline: true },
          { name: 'Total Assets', value: `${itemCount} Units`, inline: true },
          { name: 'Personnel', value: `${userCount} Operators`, inline: true },
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'loot-search') {
      const query = interaction.options.getString('query') || "";
      const items = await prisma.lootItem.findMany({
        where: { orgId: org.id, name: { contains: query } },
        take: 5
      });
      if (items.length === 0) return interaction.reply({ content: `❌ No assets found matching criteria: **${query}**`, ephemeral: true });
      const embed = new EmbedBuilder()
        .setColor('#00D1FF')
        .setTitle(`🔍 SEARCH RESULTS: "${query}"`)
        .setDescription(items.map(i => `• **${i.name}** [${i.category}] - Qty: ${i.quantity}`).join('\n'));
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'my-assets') {
      if (!dbUser) return interaction.reply({ content: "❌ Error: Your Discord account is not linked. Use `/link-account` first.", ephemeral: true });
      const assets = await prisma.distributionLog.findMany({
        where: { recipientId: dbUser.id, type: "ASSIGNED" },
        orderBy: { timestamp: 'desc' }
      });
      if (assets.length === 0) return interaction.reply({ content: "📁 Your personnel manifest is currently empty.", ephemeral: true });
      const embed = new EmbedBuilder()
        .setColor('#20C997')
        .setTitle(`👤 OPERATOR ASSETS: ${dbUser.name || dbUser.username}`)
        .setDescription(assets.map(a => `• **${a.itemName}** (Qty: ${a.quantity}) - Assigned: ${a.timestamp.toLocaleDateString()}`).join('\n'));
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'request-asset') {
      if (!dbUser) return interaction.reply({ content: "❌ Error: Your Discord account is not linked. Use `/link-account` first.", ephemeral: true });
      if (!dbUser.orgId) return interaction.reply({ content: "❌ Error: You are not assigned to an organization node.", ephemeral: true });
      
      const itemName = interaction.options.getString('item') || "";
      const qty = interaction.options.getInteger('quantity') || 1;

      const vaultItem = await prisma.lootItem.findFirst({
        where: { orgId: dbUser.orgId, name: { contains: itemName } }
      });

      if (!vaultItem) return interaction.reply({ content: `❌ Error: Item **${itemName}** not found in the organization vault.`, ephemeral: true });

      await prisma.lootRequest.create({
        data: {
          orgId: dbUser.orgId,
          userId: dbUser.id,
          itemId: vaultItem.id,
          itemName: vaultItem.name,
          category: vaultItem.category,
          quantity: qty,
          status: "PENDING"
        }
      });

      return interaction.reply({ content: `📡 Request for **${qty}x ${vaultItem.name}** has been transmitted to Org leadership.`, ephemeral: true });
    }

    if (commandName === 'personnel') {
      if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPERADMIN')) {
        return interaction.reply({ content: "❌ Access Denied: Administrator clearance required.", ephemeral: true });
      }
      
      const where: any = {};
      if (dbUser.orgId) where.orgId = dbUser.orgId;

      const users = await prisma.user.findMany({
        where,
        orderBy: { role: 'desc' },
        take: 10
      });
      const title = dbUser.org?.name ? `👥 PERSONNEL DATABASE: ${dbUser.org.name}` : `👥 GLOBAL PERSONNEL DATABASE`;
      
      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle(title)
        .setDescription(users.map(u => `• **${u.name || u.username}** [${u.role}] ${u.discordId ? '🔗' : '⚪'}`).join('\n'))
        .setFooter({ text: "🔗 = Linked  ⚪ = Unlinked" });
      return interaction.reply({ embeds: [embed] });
    }
  });

  try {
    await client.login(org.discordBotToken);
  } catch (err: any) {
    console.error('LINK FAILURE:', err.message);
  }
}

startBot();

// scripts/run-bot.ts
import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function startBot() {
  const org = await prisma.org.findFirst();
  
  if (!org || !org.discordBotToken) {
    console.error('CRITICAL: No Discord Bot Token found in database manifest.');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // 1. Define Slash Commands
  const commands = [
    new SlashCommandBuilder()
      .setName('vault-status')
      .setDescription('Show a summary of the vault health and total items.'),
    
    new SlashCommandBuilder()
      .setName('loot-search')
      .setDescription('Search the current DIXNCOX vault inventory.')
      .addStringOption(option => 
        option.setName('query')
          .setDescription('Item name or category to search for')
          .setRequired(true)),
  ].map(command => command.toJSON());

  // 2. Register Commands with Discord
  const registerCommands = async (clientId: string) => {
    const rest = new REST({ version: '10' }).setToken(org.discordBotToken!);
    try {
      console.log('SYNCING SLASH COMMANDS WITH DISCORD...');
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log('COMMANDS SYNCHRONIZED SUCCESSFULLY.');
    } catch (error) {
      console.error('FAILED TO REGISTER COMMANDS:', error);
    }
  };

  client.once('ready', async () => {
    console.log(`-----------------------------------------`);
    console.log(`NODE ONLINE // LINK ESTABLISHED: ${client.user?.tag}`);
    console.log(`SYNCING WITH VAULT: ${org.slug}.vault.net`);
    
    if (client.user) {
      await registerCommands(client.user.id);
    }
    console.log(`-----------------------------------------`);
  });

  // 3. Handle Command Interactions
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'vault-status') {
      const itemCount = await prisma.lootItem.count({ where: { orgId: org.id } });
      const embed = new EmbedBuilder()
        .setColor('#00D1FF')
        .setTitle(`📡 VAULT TELEMETRY: ${org.name}`)
        .addFields(
          { name: 'System Status', value: '🟢 OPTIMAL', inline: true },
          { name: 'Total Assets', value: `${itemCount} Units`, inline: true },
          { name: 'Encryption', value: 'AES-256-X ACTIVE', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'DIXNCOX Manifest Bridge' });

      await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'loot-search') {
      const query = interaction.options.getString('query') || "";
      const items = await prisma.lootItem.findMany({
        where: {
          orgId: org.id,
          name: { contains: query }
        },
        take: 5
      });

      if (items.length === 0) {
        return interaction.reply(`❌ No assets found matching criteria: **${query}**`);
      }

      const embed = new EmbedBuilder()
        .setColor('#00D1FF')
        .setTitle(`🔍 SEARCH RESULTS: "${query}"`)
        .setDescription(items.map(i => `• **${i.name}** [${i.category}] - Qty: ${i.quantity}`).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  });

  try {
    await client.login(org.discordBotToken);
  } catch (err: any) {
    console.error('LINK FAILURE:', err.message);
  }
}

startBot();

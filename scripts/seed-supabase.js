// Script de Seed Automatizado para Supabase (VÉRSE)
// Cria contas administrativas e dados iniciais via Auth Admin API e Service Role Key

const fs = require('fs');
const path = require('path');

// Carrega .env.local se existir
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const SEED_USERS = [
  {
    email: 'richard@verse.app',
    password: 'Password@Verse2026!',
    user_metadata: {
      username: 'richard',
      full_name: 'Richard',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    bio: 'Desenvolvedor e entusiasta de sistemas distribuídos, soberania digital e redes seguras. Explorando o VÉRSE 🚀',
    role: 'admin',
  },
  {
    email: 'oficial@verse.app',
    password: 'Password@Verse2026!',
    user_metadata: {
      username: 'verse_oficial',
      full_name: 'VÉRSE Oficial',
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    },
    bio: 'Conta oficial da rede social VÉRSE. Liberdade de expressão, privacidade de ponta a ponta e inteligência artificial ética.',
    role: 'admin',
  },
  {
    email: 'clara@verse.app',
    password: 'Password@Verse2026!',
    user_metadata: {
      username: 'clara_dev',
      full_name: 'Clara Silva',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    bio: 'Engenheira Frontend & Web Crypto. Defensora ferrenha de privacidade digital, software livre e criptografia E2EE.',
    role: 'user',
  },
];

async function seed() {
  console.log(`Conectando ao Supabase em: ${supabaseUrl}\n`);
  const createdProfiles = [];

  // 1. Cria usuários no Supabase Auth com email pré-confirmado
  for (const u of SEED_USERS) {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: u.user_metadata,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      console.log(`✓ Usuário criado no Auth: ${u.email} (ID: ${data.id})`);
      createdProfiles.push({ id: data.id, ...u });
    } else if (data.message && data.message.includes('already been registered')) {
      // Usuário já existe, busca ID existente
      console.log(`ℹ Usuário ${u.email} já existe no Auth.`);
      const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      const listData = await listRes.json();
      const existing = (listData.users || []).find((usr) => usr.email === u.email);
      if (existing) {
        createdProfiles.push({ id: existing.id, ...u });
      }
    } else {
      console.warn(`Aviso ao criar usuário ${u.email}:`, data);
    }
  }

  // 2. Atualiza os perfis criados pelo trigger com bio e role adequados
  for (const p of createdProfiles) {
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        bio: p.bio,
        role: p.role,
        avatar_url: p.user_metadata.avatar_url,
      }),
    });

    if (updateRes.ok) {
      console.log(`✓ Perfil @${p.user_metadata.username} atualizado com bio e cargo (${p.role}).`);
    } else {
      console.warn(`Aviso ao atualizar perfil @${p.user_metadata.username}:`, await updateRes.text());
    }
  }

  // 3. Cria publicações inaugurais caso a tabela esteja vazia
  const postsCheckRes = await fetch(`${supabaseUrl}/rest/v1/posts?select=id&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const existingPosts = await postsCheckRes.json();

  if (Array.isArray(existingPosts) && existingPosts.length === 0 && createdProfiles.length >= 2) {
    const verseOficial = createdProfiles.find((p) => p.user_metadata.username === 'verse_oficial');
    const richard = createdProfiles.find((p) => p.user_metadata.username === 'richard');

    const samplePosts = [
      {
        author_id: verseOficial.id,
        content: 'Bem-vindo ao VÉRSE! 🌐 Uma rede social de microblogging independente, sem algoritmos predatórios, com zero venda de dados, criptografia de ponta a ponta (E2EE) e IA sob controle estrito do usuário. O universo é seu.',
        likes_count: 5,
        replies_count: 0,
        reposts_count: 2,
      },
      {
        author_id: richard.id,
        content: 'Acabei de configurar o VÉRSE integrado com PostgreSQL, Supabase e Row Level Security (RLS) ativo em 100% das tabelas. A sensação de ter soberania digital completa é impagável!',
        likes_count: 3,
        replies_count: 0,
        reposts_count: 1,
      },
    ];

    for (const post of samplePosts) {
      const pRes = await fetch(`${supabaseUrl}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(post),
      });

      if (pRes.ok) {
        console.log(`✓ Publicação inaugural inserida.`);
      } else {
        console.warn(`Aviso ao inserir post:`, await pRes.text());
      }
    }
  }

  console.log('\n✨ Projeto Supabase inicializado e populado com sucesso!');
}

seed().catch(console.error);

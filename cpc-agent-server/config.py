# -*- coding: utf-8 -*-
"""CPC Agent Server 설정"""
import os
from dotenv import load_dotenv

load_dotenv()

# === CPC ===
CPC_API_BASE = 'https://claude-platoons-control.vercel.app'

# === Supabase (Realtime 리스너) ===
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://hlpovizxnrnspobddxmq.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')

# === Anthropic (Agent SDK) ===
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')

# === 프로젝트 경로 ===
PROJECT_CWD = os.getenv('PROJECT_CWD', 'G:/내 드라이브/mychatbot-world/')

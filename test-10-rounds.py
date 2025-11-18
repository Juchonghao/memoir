#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
import sys
from datetime import datetime

# 配置
SUPABASE_URL = "https://lafpbfjtbupootnpornv.supabase.co"
API_KEY = "f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f"
CHAPTER = "童年故里"

# 使用已存在的测试用户ID（避免外键约束问题）
# 如果需要，可以先用这个ID创建一个用户记录
USER_ID = "550e8400-e29b-41d4-a716-446655440000"

# 模拟用户回答
USER_ANSWERS = [
    "我小时候住在农村",
    "家里有父母和两个兄弟姐妹",
    "我们经常一起在院子里玩",
    "最喜欢玩捉迷藏",
    "我爱吃鱼香肉丝",
    "我爸妈都是工程师",
    "经常带我们去田里",
    "记得有一次在河边玩水",
    "那时候没有那么多玩具",
    "我在祥荣里小学"
]

def count_chinese_chars(text):
    """计算中文字符数"""
    return sum(1 for char in text if '\u4e00' <= char <= '\u9fff')

def call_api(data):
    """调用API并返回响应和耗时"""
    url = f"{SUPABASE_URL}/functions/v1/interview-start"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    start_time = time.time()
    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            return response.json(), duration, None
        else:
            return None, duration, f"HTTP {response.status_code}: {response.text}"
    except Exception as e:
        duration = time.time() - start_time
        return None, duration, str(e)

def main():
    print("=" * 50)
    print("连续十轮对话测试")
    print("检查问题长度和质量")
    print("=" * 50)
    print()
    print(f"测试用户ID: {USER_ID}")
    print(f"章节: {CHAPTER}")
    print()
    
    session_id = None
    round_number = 0
    total_time = 0
    question_lengths = []
    short_questions = 0
    min_length = float('inf')
    max_length = 0
    all_questions = []
    
    # 第一轮：开始对话
    print("-" * 50)
    print("第 1 轮：开始对话")
    print("-" * 50)
    
    data = {
        "userId": USER_ID,
        "chapter": CHAPTER
    }
    
    result, duration, error = call_api(data)
    
    if error:
        print(f"❌ 错误: {error}")
        sys.exit(1)
    
    if not result or not result.get("success"):
        print(f"❌ 获取问题失败")
        print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        sys.exit(1)
    
    data_result = result.get("data", {})
    question = data_result.get("question", "")
    session_id = data_result.get("sessionId")
    round_number = data_result.get("roundNumber", 0)
    
    if not question:
        print("❌ 问题为空")
        sys.exit(1)
    
    question_length = len(question)
    chinese_count = count_chinese_chars(question)
    total_time += duration
    question_lengths.append(question_length)
    all_questions.append((1, question, question_length, duration))
    
    print(f"✓ AI问题: {question}")
    print(f"  字符数: {question_length} (中文字符: {chinese_count})")
    print(f"  响应时间: {duration:.2f}秒")
    print()
    
    if question_length < 20:
        short_questions += 1
        print("⚠️  警告：问题过短（少于20字符）")
        print()
    
    min_length = min(min_length, question_length)
    max_length = max(max_length, question_length)
    
    # 第2-10轮：继续对话
    for i in range(2, 11):
        if not session_id:
            print("❌ Session ID 丢失，无法继续")
            break
        
        user_answer = USER_ANSWERS[i - 2]
        prev_round = round_number
        
        print("-" * 50)
        print(f"第 {i} 轮：继续对话")
        print("-" * 50)
        print(f"用户回答: {user_answer}")
        
        data = {
            "userId": USER_ID,
            "chapter": CHAPTER,
            "sessionId": session_id,
            "userAnswer": user_answer,
            "roundNumber": prev_round
        }
        
        result, duration, error = call_api(data)
        
        if error:
            print(f"❌ 错误: {error}")
            continue
        
        if not result or not result.get("success"):
            print(f"❌ 获取问题失败")
            print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
            continue
        
        data_result = result.get("data", {})
        question = data_result.get("question", "")
        round_number = data_result.get("roundNumber", 0)
        
        if not question:
            print("❌ 问题为空")
            continue
        
        question_length = len(question)
        chinese_count = count_chinese_chars(question)
        total_time += duration
        question_lengths.append(question_length)
        all_questions.append((i, question, question_length, duration))
        
        print(f"✓ AI问题: {question}")
        print(f"  字符数: {question_length} (中文字符: {chinese_count})")
        print(f"  响应时间: {duration:.2f}秒")
        print()
        
        if question_length < 20:
            short_questions += 1
            print("⚠️  警告：问题过短（少于20字符）")
            print()
        
        min_length = min(min_length, question_length)
        max_length = max(max_length, question_length)
        
        # 短暂延迟
        time.sleep(1)
    
    # 统计结果
    print()
    print("=" * 50)
    print("测试统计结果")
    print("=" * 50)
    print()
    print(f"总轮数: {len(question_lengths)}")
    print(f"总耗时: {total_time:.2f}秒")
    avg_time = total_time / len(question_lengths) if question_lengths else 0
    print(f"平均响应时间: {avg_time:.2f}秒")
    print()
    print("问题长度统计:")
    print(f"  最短: {min_length} 字符")
    print(f"  最长: {max_length} 字符")
    avg_length = sum(question_lengths) / len(question_lengths) if question_lengths else 0
    print(f"  平均: {avg_length:.1f} 字符")
    print()
    print("每轮问题详情:")
    for round_num, q, length, dur in all_questions:
        status = "⚠️ 过短" if length < 20 else "✓"
        print(f"  第{round_num}轮: {length} 字符, {dur:.2f}秒 {status}")
        print(f"    问题: {q}")
        print()
    
    if short_questions > 0:
        print(f"⚠️  发现 {short_questions} 个过短的问题（少于20字符）")
    else:
        print("✓ 所有问题长度正常")
    
    print()
    print("=" * 50)

if __name__ == "__main__":
    main()


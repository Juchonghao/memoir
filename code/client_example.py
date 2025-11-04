#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatTTS客户端示例
展示如何使用ChatTTS HTTP服务进行文本转语音
"""

import requests
import base64
import json
import os
import argparse
from pathlib import Path

class ChatTTSClient:
    """ChatTTS HTTP客户端"""
    
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'ChatTTS-Client/1.0'
        })
    
    def health_check(self):
        """健康检查"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            return response.status_code == 200, response.json()
        except Exception as e:
            return False, str(e)
    
    def get_speakers(self):
        """获取可用音色列表"""
        try:
            response = self.session.get(f"{self.base_url}/api/speakers")
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, f"HTTP {response.status_code}"
        except Exception as e:
            return False, str(e)
    
    def text_to_speech(self, text, speaker="female-shaonv", speed=1.0, pitch=0, volume=1.0, output_file=None):
        """
        文本转语音
        
        Args:
            text: 要转换的文本
            speaker: 音色ID
            speed: 语速 (0.5-2.0)
            pitch: 音调 (-12到12)
            volume: 音量 (0.1-2.0)
            output_file: 输出文件名，如果为None则自动生成
        
        Returns:
            tuple: (success, result)
        """
        data = {
            "text": text,
            "speaker": speaker,
            "speed": speed,
            "pitch": pitch,
            "volume": volume
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/tts", json=data, timeout=60)
            if response.status_code == 200:
                if output_file is None:
                    output_file = f"tts_{int(time.time())}.wav"
                
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                
                return True, {
                    "file": output_file,
                    "size": len(response.content),
                    "message": f"音频已保存到 {output_file}"
                }
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
        except Exception as e:
            return False, str(e)
    
    def text_to_speech_base64(self, text, speaker="female-shaonv", speed=1.0, pitch=0, volume=1.0):
        """
        文本转语音（返回base64编码）
        """
        data = {
            "text": text,
            "speaker": speaker,
            "speed": speed,
            "pitch": pitch,
            "volume": volume
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/tts_base64", json=data, timeout=60)
            if response.status_code == 200:
                result = response.json()
                if 'audio_base64' in result:
                    return True, result
                else:
                    return False, "响应中缺少audio_base64字段"
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
        except Exception as e:
            return False, str(e)

def demo_basic_usage():
    """基础使用示例"""
    print("=== ChatTTS客户端基础使用示例 ===\n")
    
    client = ChatTTSClient()
    
    # 1. 健康检查
    print("1. 健康检查")
    success, result = client.health_check()
    if success:
        print(f"   ✓ 服务状态: {result['message']}")
        print(f"   ✓ 模型加载: {result['model_loaded']}")
    else:
        print(f"   ✗ 连接失败: {result}")
        return
    print()
    
    # 2. 获取音色列表
    print("2. 获取音色列表")
    success, result = client.get_speakers()
    if success:
        speakers = result.get('speakers', [])
        print(f"   ✓ 可用音色: {len(speakers)}个")
        for speaker in speakers:
            print(f"     - {speaker['id']}: {speaker['name']} ({speaker['description']})")
    else:
        print(f"   ✗ 获取失败: {result}")
    print()
    
    # 3. 文本转语音示例
    print("3. 文本转语音示例")
    test_text = "你好！欢迎使用ChatTTS文本转语音服务。这是一个功能强大的语音合成工具。"
    
    print(f"   文本内容: {test_text}")
    print("   正在生成语音...")
    
    success, result = client.text_to_speech(
        text=test_text,
        speaker="female-shaonv",
        speed=1.0,
        pitch=0,
        volume=1.0,
        output_file="demo_output.wav"
    )
    
    if success:
        print(f"   ✓ {result['message']}")
        print(f"   ✓ 文件大小: {result['size']} 字节")
    else:
        print(f"   ✗ 生成失败: {result}")
    print()

def demo_advanced_usage():
    """高级使用示例"""
    print("=== ChatTTS客户端高级使用示例 ===\n")
    
    client = ChatTTSClient()
    
    # 不同音色的演示
    test_texts = [
        ("female-shaonv", "这是清甜少女的声音，听起来很温柔。"),
        ("female-yujie", "这是成熟御姐的声音，更有磁性。"),
        ("male-qingshu", "这是年轻男性的声音，充满活力。"),
        ("male-dashu", "这是成熟男性的声音，沉稳可靠。")
    ]
    
    print("4. 不同音色演示")
    for i, (speaker, text) in enumerate(test_texts, 1):
        print(f"   {i}. 测试音色: {speaker}")
        print(f"      文本: {text}")
        
        output_file = f"demo_{speaker}.wav"
        success, result = client.text_to_speech(
            text=text,
            speaker=speaker,
            output_file=output_file
        )
        
        if success:
            print(f"      ✓ 成功生成: {output_file}")
        else:
            print(f"      ✗ 生成失败: {result}")
        print()
    
    # 参数调节演示
    print("5. 参数调节演示")
    base_text = "这是参数调节测试。"
    
    param_tests = [
        {"speed": 0.8, "pitch": 0, "volume": 1.0, "desc": "慢速"},
        {"speed": 1.2, "pitch": 0, "volume": 1.0, "desc": "快速"},
        {"speed": 1.0, "pitch": -3, "volume": 1.0, "desc": "低音调"},
        {"speed": 1.0, "pitch": 3, "volume": 1.0, "desc": "高音调"},
        {"speed": 1.0, "pitch": 0, "volume": 0.7, "desc": "低音量"},
        {"speed": 1.0, "pitch": 0, "volume": 1.3, "desc": "高音量"},
    ]
    
    for i, params in enumerate(param_tests, 1):
        print(f"   {i}. {params['desc']} (语速:{params['speed']}, 音调:{params['pitch']}, 音量:{params['volume']})")
        
        output_file = f"demo_param_{i}.wav"
        success, result = client.text_to_speech(
            text=base_text,
            speaker="female-shaonv",
            output_file=output_file,
            **params
        )
        
        if success:
            print(f"      ✓ 成功生成: {output_file}")
        else:
            print(f"      ✗ 生成失败: {result}")
        print()

def batch_text_to_speech(text_file, output_dir="batch_output"):
    """批量文本转语音"""
    print(f"=== 批量文本转语音 ===\n")
    
    # 读取文本文件
    if not os.path.exists(text_file):
        print(f"错误: 文本文件 {text_file} 不存在")
        return
    
    with open(text_file, 'r', encoding='utf-8') as f:
        texts = [line.strip() for line in f if line.strip()]
    
    if not texts:
        print("错误: 文本文件为空")
        return
    
    print(f"读取到 {len(texts)} 行文本")
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    client = ChatTTSClient()
    
    success_count = 0
    for i, text in enumerate(texts, 1):
        print(f"处理第 {i}/{len(texts)} 行: {text[:50]}...")
        
        output_file = os.path.join(output_dir, f"batch_{i:03d}.wav")
        success, result = client.text_to_speech(
            text=text,
            speaker="female-shaonv",
            output_file=output_file
        )
        
        if success:
            success_count += 1
            print(f"   ✓ 成功: {output_file}")
        else:
            print(f"   ✗ 失败: {result}")
    
    print(f"\n批量处理完成: {success_count}/{len(texts)} 成功")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="ChatTTS客户端示例")
    parser.add_argument("--url", default="http://localhost:8080", help="服务地址")
    parser.add_argument("--demo", action="store_true", help="运行演示")
    parser.add_argument("--text", help="要转换的文本")
    parser.add_argument("--speaker", default="female-shaonv", help="音色ID")
    parser.add_argument("--speed", type=float, default=1.0, help="语速")
    parser.add_argument("--pitch", type=int, default=0, help="音调")
    parser.add_argument("--volume", type=float, default=1.0, help="音量")
    parser.add_argument("--output", help="输出文件名")
    parser.add_argument("--batch", help="批量处理文本文件")
    parser.add_argument("--list-speakers", action="store_true", help="列出可用音色")
    
    args = parser.parse_args()
    
    client = ChatTTSClient(args.url)
    
    if args.list_speakers:
        success, result = client.get_speakers()
        if success:
            speakers = result.get('speakers', [])
            print("可用音色列表:")
            for speaker in speakers:
                print(f"  {speaker['id']}: {speaker['name']} - {speaker['description']}")
        else:
            print(f"获取音色列表失败: {result}")
        return
    
    if args.demo:
        demo_basic_usage()
        demo_advanced_usage()
        return
    
    if args.batch:
        batch_text_to_speech(args.batch)
        return
    
    if args.text:
        print(f"转换文本: {args.text}")
        print(f"音色: {args.speaker}")
        print(f"参数: 语速={args.speed}, 音调={args.pitch}, 音量={args.volume}")
        print("正在生成语音...")
        
        success, result = client.text_to_speech(
            text=args.text,
            speaker=args.speaker,
            speed=args.speed,
            pitch=args.pitch,
            volume=args.volume,
            output_file=args.output
        )
        
        if success:
            print(f"✓ {result['message']}")
        else:
            print(f"✗ 生成失败: {result}")
        return
    
    # 如果没有指定参数，显示帮助
    parser.print_help()

if __name__ == "__main__":
    import time
    main()
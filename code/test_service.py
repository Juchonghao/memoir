#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatTTS服务测试脚本
用于验证服务是否正常工作
"""

import requests
import json
import time
import base64
import os

# 服务配置
SERVICE_URL = "http://localhost:8080"

def test_health_check():
    """测试健康检查接口"""
    print("1. 测试健康检查接口...")
    try:
        response = requests.get(f"{SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ 健康检查通过: {data['message']}")
            print(f"   ✓ 模型加载状态: {data['model_loaded']}")
            return True
        else:
            print(f"   ✗ 健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ 连接失败: {e}")
        return False

def test_service_info():
    """测试服务信息接口"""
    print("2. 测试服务信息接口...")
    try:
        response = requests.get(f"{SERVICE_URL}/api/info", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ 服务信息获取成功")
            print(f"   ✓ 服务版本: {data['version']}")
            print(f"   ✓ 可用端点: {len(data['endpoints'])}个")
            return True
        else:
            print(f"   ✗ 服务信息获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ 连接失败: {e}")
        return False

def test_speakers():
    """测试音色列表接口"""
    print("3. 测试音色列表接口...")
    try:
        response = requests.get(f"{SERVICE_URL}/api/speakers", timeout=5)
        if response.status_code == 200:
            data = response.json()
            speakers = data.get('speakers', [])
            print(f"   ✓ 音色列表获取成功，共{len(speakers)}个音色")
            for speaker in speakers[:3]:  # 显示前3个音色
                print(f"     - {speaker['name']}: {speaker['description']}")
            return True
        else:
            print(f"   ✗ 音色列表获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ 连接失败: {e}")
        return False

def test_tts_base64():
    """测试文本转语音接口（base64返回）"""
    print("4. 测试文本转语音接口（base64）...")
    try:
        test_text = "你好，这是ChatTTS服务的测试。"
        data = {
            "text": test_text,
            "speaker": "female-shaonv",
            "speed": 1.0,
            "pitch": 0,
            "volume": 1.0
        }
        
        response = requests.post(
            f"{SERVICE_URL}/api/tts_base64",
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'audio_base64' in result:
                audio_base64 = result['audio_base64']
                # 解码并保存测试音频
                audio_data = base64.b64decode(audio_base64)
                test_audio_file = "test_output.wav"
                with open(test_audio_file, 'wb') as f:
                    f.write(audio_data)
                
                file_size = os.path.getsize(test_audio_file)
                print(f"   ✓ 文本转语音成功")
                print(f"   ✓ 音频文件大小: {file_size} 字节")
                print(f"   ✓ 测试音频已保存为: {test_audio_file}")
                return True
            else:
                print(f"   ✗ 响应中缺少audio_base64字段")
                return False
        else:
            print(f"   ✗ 文本转语音失败: {response.status_code}")
            print(f"   ✗ 错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False

def test_tts_file():
    """测试文本转语音接口（文件下载）"""
    print("5. 测试文本转语音接口（文件下载）...")
    try:
        test_text = "这是文件下载测试。"
        data = {
            "text": test_text,
            "speaker": "male-dashu",
            "speed": 1.1,
            "pitch": -1
        }
        
        response = requests.post(
            f"{SERVICE_URL}/api/tts",
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            # 保存下载的音频文件
            test_file = "test_download.wav"
            with open(test_file, 'wb') as f:
                f.write(response.content)
            
            file_size = os.path.getsize(test_file)
            print(f"   ✓ 文件下载成功")
            print(f"   ✓ 音频文件大小: {file_size} 字节")
            print(f"   ✓ 测试文件已保存为: {test_file}")
            return True
        else:
            print(f"   ✗ 文件下载失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False

def test_error_handling():
    """测试错误处理"""
    print("6. 测试错误处理...")
    try:
        # 测试空文本
        response = requests.post(
            f"{SERVICE_URL}/api/tts_base64",
            json={"text": ""},
            timeout=5
        )
        if response.status_code == 400:
            print("   ✓ 空文本错误处理正常")
        else:
            print(f"   ✗ 空文本错误处理异常: {response.status_code}")
            return False
        
        # 测试缺少参数
        response = requests.post(
            f"{SERVICE_URL}/api/tts_base64",
            json={},
            timeout=5
        )
        if response.status_code == 400:
            print("   ✓ 缺少参数错误处理正常")
        else:
            print(f"   ✗ 缺少参数错误处理异常: {response.status_code}")
            return False
        
        return True
    except Exception as e:
        print(f"   ✗ 错误处理测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 60)
    print("ChatTTS服务功能测试")
    print("=" * 60)
    print(f"测试目标: {SERVICE_URL}")
    print()
    
    # 检查服务是否运行
    print("正在检查服务状态...")
    if not test_health_check():
        print("\n❌ 服务未运行或无法连接，请先启动ChatTTS服务")
        print("启动命令: python chattts_server.py")
        return
    
    print()
    
    # 运行各项测试
    tests = [
        test_service_info,
        test_speakers,
        test_tts_base64,
        test_tts_file,
        test_error_handling
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        if test_func():
            passed += 1
        print()
    
    # 显示测试结果
    print("=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    print(f"总测试项: {total}")
    print(f"通过测试: {passed}")
    print(f"失败测试: {total - passed}")
    
    if passed == total:
        print("\n🎉 所有测试通过！ChatTTS服务运行正常。")
    else:
        print(f"\n⚠️  有 {total - passed} 项测试失败，请检查服务配置。")
    
    print("\n清理测试文件...")
    test_files = ["test_output.wav", "test_download.wav"]
    for file in test_files:
        if os.path.exists(file):
            os.remove(file)
            print(f"  已删除: {file}")

if __name__ == "__main__":
    main()
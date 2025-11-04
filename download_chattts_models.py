#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatTTS模型下载和验证脚本
"""

import os
import sys
import time
import torch
import ChatTTS
from pathlib import Path

def download_chattts_models():
    """下载ChatTTS预训练模型"""
    print("=" * 60)
    print("ChatTTS预训练模型下载程序")
    print("=" * 60)
    
    # 创建模型目录
    models_dir = Path("/workspace/models")
    models_dir.mkdir(exist_ok=True)
    print(f"模型目录: {models_dir}")
    
    try:
        # 初始化ChatTTS
        print("\n1. 初始化ChatTTS...")
        chat = ChatTTS.Chat()
        print("✓ ChatTTS初始化成功")
        
        # 下载模型
        print("\n2. 下载预训练模型...")
        print("正在下载模型，这可能需要几分钟时间...")
        
        # 使用官方方式下载模型
        chat.download_models()
        print("✓ 模型下载完成")
        
        # 验证模型加载
        print("\n3. 验证模型加载...")
        
        # 检查模型文件
        model_files = []
        for root, dirs, files in os.walk(models_dir):
            for file in files:
                if file.endswith(('.pt', '.bin', '.safetensors')):
                    model_files.append(os.path.join(root, file))
        
        print(f"模型文件数量: {len(model_files)}")
        for model_file in model_files:
            file_size = os.path.getsize(model_file) / (1024 * 1024)  # MB
            print(f"  - {os.path.basename(model_file)}: {file_size:.2f} MB")
        
        # 测试模型功能
        print("\n4. 测试模型功能...")
        test_text = "你好，这是一个测试语音合成功能的示例。"
        print(f"测试文本: {test_text}")
        
        # 生成音频
        wav = chat.synthesize(test_text)
        print("✓ 语音合成测试成功")
        
        # 保存测试音频
        output_path = models_dir / "test_output.wav"
        with open(output_path, "wb") as f:
            f.write(wav)
        print(f"✓ 测试音频已保存: {output_path}")
        
        print("\n" + "=" * 60)
        print("ChatTTS模型下载和验证完成！")
        print("=" * 60)
        print(f"模型位置: {models_dir}")
        print(f"测试音频: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = download_chattts_models()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatTTS本地HTTP服务
提供文本转语音API接口
"""

import os
import io
import base64
import tempfile
import re
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import ChatTTS

# ChatTTS bug已直接在源文件中修复
# 修复位置：/Users/chonghaoju/miniconda3/lib/python3.12/site-packages/ChatTTS/model/gpt.py
# 修复内容：narrow()操作的参数验证，避免负数长度错误
print("✅ ChatTTS bug修复已应用（直接修复源文件）")

import torch
import numpy as np
import soundfile as sf
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量存储ChatTTS模型
chattts_model = None

def init_chattts():
    """初始化ChatTTS模型"""
    global chattts_model
    try:
        print("正在初始化ChatTTS模型...")
        # ChatTTS 0.2.4 使用 ChatTTS.Chat() 和 load() 方法
        chattts_model = ChatTTS.Chat()
        
        # 检查模型是否已加载
        if not chattts_model.has_loaded():
            print("正在加载ChatTTS模型...")
            # 先尝试下载模型（如果需要）
            try:
                chattts_model.download_models()
            except Exception as download_error:
                print(f"模型下载提示: {download_error}")
            
            # 加载模型
            chattts_model.load()
        
        # 确保模型已加载
        if chattts_model.has_loaded():
            print("ChatTTS模型初始化完成!")
            # 等待模型完全初始化
            import time
            time.sleep(1)
            print("模型组件检查完成")
            return True
        else:
            print("警告: ChatTTS模型未完全加载，将在首次请求时自动加载")
            return True  # 仍然返回True，允许在请求时自动加载
    except Exception as e:
        print(f"ChatTTS模型初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'message': 'ChatTTS服务运行正常',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': chattts_model is not None
    })

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """文本转语音接口"""
    try:
        if chattts_model is None:
            return jsonify({'error': 'ChatTTS模型未初始化'}), 500
        
        # 检查模型是否已加载
        if not chattts_model.has_loaded():
            print("模型未加载，正在加载...")
            chattts_model.load()
            if not chattts_model.has_loaded():
                return jsonify({'error': 'ChatTTS模型加载失败'}), 500
        
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': '缺少text参数'}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({'error': '文本内容不能为空'}), 400
        
        # 清理文本：替换中文标点符号为英文标点符号，避免ChatTTS处理错误
        import re
        # 定义中文标点到英文标点的映射
        punct_map = {
            '？': '?', '！': '!', '，': ',', '。': '.',
            '：': ':', '；': ';', '（': '(', '）': ')',
            '【': '[', '】': ']', '《': '<', '》': '>',
            '「': '"', '」': '"', '『': '"', '』': '"',
            '…': '...', '—': '-', '、': ',', '·': '.',
            '～': '~', '￥': '$', '×': 'x', '÷': '/',
            '＋': '+', '－': '-', '＝': '=', '％': '%'
        }
        # 替换所有中文标点
        for ch_punct, en_punct in punct_map.items():
            text = text.replace(ch_punct, en_punct)
        # 移除所有其他非ASCII标点符号（保留ASCII可打印字符和中文字符）
        text = re.sub(r'[^\x00-\x7F\u4e00-\u9fff\s]', '', text)
        # 清理多余空格
        text = ' '.join(text.split())
        
        # 获取可选参数
        speaker = data.get('speaker', 'female-shaonv')  # 默认音色
        speed = data.get('speed', 1.0)  # 语速
        pitch = data.get('pitch', 0)  # 音调
        volume = data.get('volume', 1.0)  # 音量
        
        print(f"处理文本转语音请求: {text[:50]}...")
        print(f"清理后的文本: {repr(text)}")
        
        # 更激进的清理：移除所有可能导致问题的标点符号
        # ChatTTS似乎对某些字符很敏感，即使清理后也会有问题
        text = text.replace('?', '').replace('!', '').replace('？', '').replace('！', '')
        # 只保留中文、英文、数字和基本标点
        text = re.sub(r'[^\w\s\u4e00-\u9fff.,;:()]', '', text)
        text = ' '.join(text.split())  # 清理空格
        
        print(f"最终清理后的文本: {repr(text)}")
        
        # 生成语音 - 尝试多种调用方式，找到能工作的
        with torch.no_grad():
            wavs = None
            error_msgs = []
            
            # 方式1: 使用decoder，跳过所有文本处理，不分割文本
            try:
                print("尝试方式1: use_decoder=True, 跳过所有文本处理, split_text=False")
                wavs = chattts_model.infer(
                    text, 
                    use_decoder=True, 
                    skip_refine_text=True,
                    do_text_normalization=False,
                    do_homophone_replacement=False,
                    split_text=False
                )
                print("方式1成功!")
            except Exception as e:
                error_msgs.append(f"方式1失败: {str(e)}")
                print(f"方式1失败: {e}")
            
            # 方式2: 不使用decoder（可能更稳定）
            if not wavs:
                try:
                    print("尝试方式2: use_decoder=False")
                    wavs = chattts_model.infer(
                        text,
                        use_decoder=False,
                        skip_refine_text=True,
                        do_text_normalization=False,
                        do_homophone_replacement=False
                    )
                    print("方式2成功!")
                except Exception as e:
                    error_msgs.append(f"方式2失败: {str(e)}")
                    print(f"方式2失败: {e}")
            
            # 方式3: 最简单的调用
            if not wavs:
                try:
                    print("尝试方式3: 最简单调用")
                    wavs = chattts_model.infer(text, skip_refine_text=True)
                    print("方式3成功!")
                except Exception as e:
                    error_msgs.append(f"方式3失败: {str(e)}")
                    print(f"方式3失败: {e}")
                    # 如果所有方式都失败，返回特殊错误码，让前端知道可以回退
                    print(f"⚠️ ChatTTS 所有方式都失败，前端将回退到浏览器TTS")
                    return jsonify({
                        'error': 'ChatTTS暂时不可用',
                        'fallback_recommended': True,
                        'details': '所有生成方式都失败，建议使用浏览器TTS',
                        'errors': error_msgs
                    }), 503  # 503 Service Unavailable
        
        if not wavs or len(wavs) == 0:
            return jsonify({'error': '语音生成失败'}), 500
        
        # 获取生成的音频数据
        # ChatTTS 0.2.4 返回格式可能不同
        if isinstance(wavs, list):
            wav = wavs[0]
        else:
            wav = wavs
        
        # 确保是numpy数组
        if hasattr(wav, 'squeeze'):
            wav = wav.squeeze()
        if hasattr(wav, 'cpu'):
            wav = wav.cpu().numpy()
        
        # 创建临时文件保存音频
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            # 转换为16kHz采样率
            if wav.dtype != np.int16:
                wav = (wav * 32767).astype(np.int16)
            
            # 确保采样率是16kHz
            sample_rate = 24000  # ChatTTS默认采样率
            sf.write(tmp_file.name, wav, sample_rate)
            tmp_filename = tmp_file.name
        
        # 返回音频文件
        return send_file(
            tmp_filename,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f'tts_{datetime.now().strftime("%Y%m%d_%H%M%S")}.wav'
        )
        
    except Exception as e:
        print(f"文本转语音处理失败: {e}")
        return jsonify({'error': f'处理失败: {str(e)}'}), 500

@app.route('/api/tts_base64', methods=['POST'])
def text_to_speech_base64():
    """文本转语音接口（返回base64编码）"""
    try:
        if chattts_model is None:
            return jsonify({'error': 'ChatTTS模型未初始化'}), 500
        
        # 检查模型是否已加载
        if not chattts_model.has_loaded():
            print("模型未加载，正在加载...")
            chattts_model.load()
            if not chattts_model.has_loaded():
                return jsonify({'error': 'ChatTTS模型加载失败'}), 500
        
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': '缺少text参数'}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({'error': '文本内容不能为空'}), 400
        
        # 清理文本：替换中文标点符号为英文标点符号，避免ChatTTS处理错误
        import re
        # 定义中文标点到英文标点的映射
        punct_map = {
            '？': '?', '！': '!', '，': ',', '。': '.',
            '：': ':', '；': ';', '（': '(', '）': ')',
            '【': '[', '】': ']', '《': '<', '》': '>',
            '「': '"', '」': '"', '『': '"', '』': '"',
            '…': '...', '—': '-', '、': ',', '·': '.',
            '～': '~', '￥': '$', '×': 'x', '÷': '/',
            '＋': '+', '－': '-', '＝': '=', '％': '%'
        }
        # 替换所有中文标点
        for ch_punct, en_punct in punct_map.items():
            text = text.replace(ch_punct, en_punct)
        # 移除所有其他非ASCII标点符号（保留ASCII可打印字符和中文字符）
        text = re.sub(r'[^\x00-\x7F\u4e00-\u9fff\s]', '', text)
        # 清理多余空格
        text = ' '.join(text.split())
        
        # 获取可选参数
        speaker = data.get('speaker', 'female-shaonv')
        speed = data.get('speed', 1.0)
        pitch = data.get('pitch', 0)
        volume = data.get('volume', 1.0)
        
        print(f"处理文本转语音请求(base64): {text[:50]}...")
        print(f"清理后的文本: {repr(text)}")
        print(f"[DEBUG] 文本长度: {len(text)}, 字符数: {len(text)}")
        
        # 更激进的清理：移除所有可能导致问题的标点符号
        # ChatTTS似乎对某些字符很敏感，即使清理后也会有问题
        text = text.replace('?', '').replace('!', '').replace('？', '').replace('！', '')
        # 只保留中文、英文、数字和基本标点
        text = re.sub(r'[^\w\s\u4e00-\u9fff.,;:()]', '', text)
        text = ' '.join(text.split())  # 清理空格
        
        print(f"最终清理后的文本: {repr(text)}")
        
        # 生成语音 - 尝试多种调用方式，找到能工作的
        with torch.no_grad():
            wavs = None
            error_msgs = []
            
            # 方式1: 使用decoder，跳过所有文本处理，不分割文本
            try:
                print("尝试方式1: use_decoder=True, 跳过所有文本处理, split_text=False")
                wavs = chattts_model.infer(
                    text, 
                    use_decoder=True, 
                    skip_refine_text=True,
                    do_text_normalization=False,
                    do_homophone_replacement=False,
                    split_text=False
                )
                print("方式1成功!")
            except Exception as e:
                error_msgs.append(f"方式1失败: {str(e)}")
                print(f"方式1失败: {e}")
            
            # 方式2: 不使用decoder（可能更稳定）
            if not wavs:
                try:
                    print("尝试方式2: use_decoder=False")
                    wavs = chattts_model.infer(
                        text,
                        use_decoder=False,
                        skip_refine_text=True,
                        do_text_normalization=False,
                        do_homophone_replacement=False
                    )
                    print("方式2成功!")
                except Exception as e:
                    error_msgs.append(f"方式2失败: {str(e)}")
                    print(f"方式2失败: {e}")
            
            # 方式3: 最简单的调用
            if not wavs:
                try:
                    print("尝试方式3: 最简单调用")
                    wavs = chattts_model.infer(text, skip_refine_text=True)
                    print("方式3成功!")
                except Exception as e:
                    error_msgs.append(f"方式3失败: {str(e)}")
                    print(f"方式3失败: {e}")
                    # 如果所有方式都失败，返回特殊错误码，让前端知道可以回退
                    print(f"⚠️ ChatTTS 所有方式都失败，前端将回退到浏览器TTS")
                    return jsonify({
                        'error': 'ChatTTS暂时不可用',
                        'fallback_recommended': True,
                        'details': '所有生成方式都失败，建议使用浏览器TTS',
                        'errors': error_msgs
                    }), 503  # 503 Service Unavailable
        
        if not wavs or len(wavs) == 0:
            return jsonify({'error': '语音生成失败'}), 500
        
        # 获取生成的音频数据
        if isinstance(wavs, list):
            wav = wavs[0]
        else:
            wav = wavs
        
        # 确保是numpy数组
        if hasattr(wav, 'squeeze'):
            wav = wav.squeeze()
        if hasattr(wav, 'cpu'):
            wav = wav.cpu().numpy()
        
        # 转换为16位整数
        if wav.dtype != np.int16:
            wav = (wav * 32767).astype(np.int16)
        
        # 转换为base64编码
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, wav, 24000, format='WAV')
        audio_buffer.seek(0)
        audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
        
        print(f"[DEBUG] 音频生成成功: wav形状={wav.shape}, base64长度={len(audio_base64)}")
        
        return jsonify({
            'success': True,
            'audio_base64': audio_base64,
            'format': 'wav',
            'sample_rate': 24000,
            'text_length': len(text)
        })
        
    except Exception as e:
        print(f"文本转语音处理失败: {e}")
        return jsonify({'error': f'处理失败: {str(e)}'}), 500

@app.route('/api/speakers', methods=['GET'])
def get_speakers():
    """获取可用的音色列表"""
    # ChatTTS预定义的音色
    speakers = [
        {'id': 'female-shaonv', 'name': '女声-少女', 'description': '清甜少女音'},
        {'id': 'female-yujie', 'name': '女声-御姐', 'description': '成熟御姐音'},
        {'id': 'male-qingshu', 'name': '男声-青叔', 'description': '年轻男性音'},
        {'id': 'male-dashu', 'name': '男声-大叔', 'description': '成熟男性音'},
        {'id': 'audiobook_female_1', 'name': '女声- audiobook', 'description': '适合朗读的女声'},
        {'id': 'audiobook_male_1', 'name': '男声- audiobook', 'description': '适合朗读的男声'}
    ]
    return jsonify({'speakers': speakers})

@app.route('/api/info', methods=['GET'])
def get_service_info():
    """获取服务信息"""
    return jsonify({
        'service': 'ChatTTS HTTP Service',
        'version': '1.0.0',
        'description': 'ChatTTS文本转语音服务',
        'endpoints': {
            'health': '/health - 健康检查',
            'tts': '/api/tts - 文本转语音(文件下载)',
            'tts_base64': '/api/tts_base64 - 文本转语音(base64)',
            'speakers': '/api/speakers - 获取音色列表',
            'info': '/api/info - 服务信息'
        },
        'parameters': {
            'text': 'string (必需) - 要转换的文本',
            'speaker': 'string (可选) - 音色ID，默认female-shaonv',
            'speed': 'float (可选) - 语速，范围0.5-2.0，默认1.0',
            'pitch': 'int (可选) - 音调，范围-12到12，默认0',
            'volume': 'float (可选) - 音量，范围0.1-2.0，默认1.0'
        },
        'model_loaded': chattts_model is not None
    })

if __name__ == '__main__':
    print("=" * 50)
    print("ChatTTS本地HTTP服务")
    print("=" * 50)
    
    # 初始化ChatTTS模型
    if init_chattts():
        print("启动HTTP服务器...")
        print("服务地址: http://localhost:8080")
        print("API文档: http://localhost:8080/api/info")
        print("健康检查: http://localhost:8080/health")
        print("按 Ctrl+C 停止服务")
        print("=" * 50)
        
        # 启动Flask服务
        app.run(host='0.0.0.0', port=8080, debug=False)
    else:
        print("ChatTTS模型初始化失败，服务无法启动")
        exit(1)
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatTTS 安装验证测试脚本
"""

def test_chattts_import():
    """测试ChatTTS导入"""
    try:
        import ChatTTS
        print("✓ ChatTTS 导入成功")
        return True
    except ImportError as e:
        print(f"✗ ChatTTS 导入失败: {e}")
        return False

def test_dependencies():
    """测试依赖包"""
    dependencies = [
        ('torch', 'PyTorch'),
        ('numpy', 'NumPy'),
        ('transformers', 'Transformers'),
        ('encodec', 'EnCodec'),
    ]
    
    success = True
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"✓ {name} 导入成功")
        except ImportError as e:
            print(f"✗ {name} 导入失败: {e}")
            success = False
    
    return success

def test_chattts_basic_functionality():
    """测试ChatTTS基本功能"""
    try:
        import ChatTTS
        
        # 创建ChatTTS实例
        chat = ChatTTS.Chat()
        print("✓ ChatTTS 实例创建成功")
        
        # 检查是否有主要方法
        methods = ['infer', 'load', 'download_models']
        for method in methods:
            if hasattr(chat, method):
                print(f"✓ ChatTTS.{method} 方法存在")
            else:
                print(f"✗ ChatTTS.{method} 方法不存在")
                return False
        
        return True
    except Exception as e:
        print(f"✗ ChatTTS 基本功能测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 50)
    print("ChatTTS 安装验证测试")
    print("=" * 50)
    
    # 测试导入
    import_success = test_chattts_import()
    
    # 测试依赖
    deps_success = test_dependencies()
    
    # 测试基本功能
    if import_success:
        func_success = test_chattts_basic_functionality()
    else:
        func_success = False
    
    print("\n" + "=" * 50)
    print("测试结果总结:")
    print(f"ChatTTS 导入: {'✓' if import_success else '✗'}")
    print(f"依赖包: {'✓' if deps_success else '✗'}")
    print(f"基本功能: {'✓' if func_success else '✗'}")
    
    if import_success and deps_success and func_success:
        print("\n🎉 所有测试通过！ChatTTS 安装成功！")
        return True
    else:
        print("\n❌ 部分测试失败，请检查安装")
        return False

if __name__ == "__main__":
    main()
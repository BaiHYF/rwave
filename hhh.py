def add_br_to_file(input_file_path, output_file_path):
    try:
        # 读取文件内容
        with open(input_file_path, "r", encoding="utf-8") as file:
            lines = file.readlines()

        # 在每一行末尾添加 <br>

        modified_lines = ["<p>" + line.rstrip("\n") + "</p>\n" for line in lines]
        modified_lines = [line.replace(".", "&ensp;&ensp;") for line in modified_lines]

        # 将修改后的内容写入新的文件
        with open(output_file_path, "w", encoding="utf-8") as file:
            file.writelines(modified_lines)

        print(f"处理完成，结果已保存到 {output_file_path}")

    except Exception as e:
        print(f"发生错误: {e}")


# 使用示例
input_file_path = "f:\\workspace\\rust\\rwave\\app\\100hun.txt"
output_file_path = "f:\\workspace\\rust\\rwave\\app\\100hun_modified.txt"
add_br_to_file(input_file_path, output_file_path)

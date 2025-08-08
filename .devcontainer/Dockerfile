FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Устанавливаем пакеты для спуфинга и Node.js
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      sudo \
      curl \
      macchanger \
      systemd \
      neofetch \
      iputils-ping \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

# Создаём пользователя vscode
ARG USER=vscode
RUN useradd -m $USER \
 && echo "$USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USER \
 && chmod 0440 /etc/sudoers.d/$USER

USER vscode
WORKDIR /home/vscode
